import React, { useState, useEffect } from 'react';
import { Page, Store } from '../types';
import { StoreCard } from '../components/StoreCard';
import { Search, Filter, SlidersHorizontal, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';
import { fetchStoreMetrics } from '../lib/storeMetrics';

interface StoresProps {
  setPage: (page: Page) => void;
  onStoreClick: (store: Store) => void;
}

export const Stores: React.FC<StoresProps> = ({ setPage, onStoreClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'clothing' | 'accessories'>('all');
  const [sortBy, setSortBy] = useState<'top-rated' | 'a-z' | 'most-items'>('top-rated');

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*');
        
        if (error) throw error;

        const storeMetrics = await fetchStoreMetrics((data || []).map(store => store.id));

        setStores(data.map(s => ({
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
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  const filteredStores = stores
    .filter(store => {
      const matchesSearch =
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (store.category || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || store.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'a-z') {
        return a.name.localeCompare(b.name);
      }

      if (sortBy === 'most-items') {
        return b.itemCount - a.itemCount;
      }

      return b.rating - a.rating;
    });

  return (
    <div className="min-h-screen py-10 md:py-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <div className="mb-10 md:mb-16">
        <h1 className="font-headline font-black text-4xl sm:text-6xl md:text-8xl tracking-tighter uppercase mb-6 md:mb-8">ALL STORES</h1>
        
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          <div className="flex-grow relative flex items-center bg-white border-4 border-ink p-3 md:p-4 neo-shadow">
            <Search size={24} className="text-ink/30 ml-2" />
            <input 
              type="text" 
              placeholder="SEARCH STORES BY NAME OR TAG..." 
              className="w-full bg-transparent border-none outline-none px-4 font-headline font-bold text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="flex items-center gap-2 bg-white border-4 border-ink px-4 md:px-5 py-3 md:py-4 neo-shadow">
              <Filter size={20} />
              <select
                className="w-full bg-transparent font-label font-bold uppercase outline-none"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as 'all' | 'clothing' | 'accessories')}
              >
                <option value="all">All Categories</option>
                <option value="clothing">Clothing</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white border-4 border-ink px-4 md:px-5 py-3 md:py-4 neo-shadow">
              <SlidersHorizontal size={20} />
              <select
                className="w-full bg-transparent font-label font-bold uppercase outline-none"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'top-rated' | 'a-z' | 'most-items')}
              >
                <option value="top-rated">Top Rated</option>
                <option value="a-z">A-Z</option>
                <option value="most-items">Most Items</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-ink" size={64} />
        </div>
      ) : filteredStores.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {filteredStores.map(store => (
            <StoreCard key={store.id} store={store} onClick={() => onStoreClick(store)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border-4 border-dashed border-ink/20">
          <p className="font-headline font-black text-3xl text-ink/30 uppercase">NO STORES FOUND MATCHING YOUR SEARCH</p>
        </div>
      )}



    </div>
  );
};
