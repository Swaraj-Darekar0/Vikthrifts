import React, { useEffect, useState } from 'react';
import { Product } from '../types';
import { supabase } from '../supabase';
import { ProductCard } from '../components/ProductCard';
import { Loader2, Search as SearchIcon } from 'lucide-react';

interface SearchResultsProps {
  query: string;
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ query, onProductClick, onAddToCart }) => {
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        // Fetch official products
        const { data: adminData } = await supabase.from('admin_products').select('*').eq('active', true);
        
        // Fetch seller products with store names
        const { data: sellerData } = await supabase.from('products').select('*, stores(name)');

        const allProducts: Product[] = [
          ...(adminData?.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image_url,
            category: p.category,
            size: p.size,
            store: 'VIKTHRIFTS OFFICIAL',
            description: p.description,
            tags: p.tags || []
          })) || []),
          ...(sellerData?.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image_url,
            category: p.category,
            size: p.size,
            store: p.stores?.name || 'Unknown Store',
            description: p.description,
            tags: p.tags || []
          })) || [])
        ];

        const lowerQuery = query.toLowerCase();
        const filtered = allProducts.filter(p => 
          p.name.toLowerCase().includes(lowerQuery) ||
          p.store.toLowerCase().includes(lowerQuery) ||
          p.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
          p.category.toLowerCase().includes(lowerQuery)
        );

        setResults(filtered);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (query) fetchResults();
  }, [query]);

  return (
    <div className="min-h-screen py-10 md:py-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <div className="mb-8 md:mb-12">
        <h1 className="font-headline font-black text-3xl sm:text-4xl uppercase mb-2">SEARCH RESULTS</h1>
        <p className="font-label font-bold text-xs sm:text-sm text-ink/50 break-words">SHOWING RESULTS FOR: "{query}"</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-ink" size={48} />
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8">
          {results.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAdd={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              onClick={() => onProductClick(product)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 sm:py-24 px-4 border-4 border-dashed border-ink/20">
          <SearchIcon size={56} className="mx-auto text-ink/10 mb-4" />
          <p className="font-headline font-black text-xl sm:text-2xl text-ink/30 uppercase">NO DROPS FOUND MATCHING YOUR SEARCH</p>
        </div>
      )}
    </div>
  );
};
