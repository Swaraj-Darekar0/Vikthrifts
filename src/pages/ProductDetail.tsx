import React, { useEffect, useMemo, useState } from 'react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { ShoppingCart, Share2, ShieldCheck, Truck, X, Copy, Mail, MessageCircle, Send, Twitter } from 'lucide-react';
import { supabase } from '../supabase';

interface ProductDetailProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product, onAddToCart, onProductClick }) => {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const sharePayload = useMemo(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('product', product.id);
    const shareUrl = url.toString();
    const shareText = `${product.name} from ${product.store} for Rs. ${product.price}`;
    return { shareUrl, shareText };
  }, [product.id, product.name, product.price, product.store]);

  useEffect(() => {
    if (!shareOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShareOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shareOpen]);

  useEffect(() => {
    let cancelled = false;

    const mapAdminToProduct = (p: any): Product => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      oldPrice: undefined,
      image: p.image_url,
      category: p.category || 'CLOTHING',
      store: 'VIKTHRIFTS OFFICIAL',
      description: p.description || '',
      tags: p.tags || [],
      size: p.size || undefined,
    });

    const mapSellerToProduct = (p: any, storeNameFallback: string): Product => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      oldPrice: undefined,
      image: p.image_url,
      category: p.category || 'CLOTHING',
      store: p.stores?.name || storeNameFallback,
      description: p.description || '',
      tags: p.tags || [],
      size: p.size || undefined,
    });

    const fetchRelated = async () => {
      setRelatedLoading(true);
      try {
        // 1) If this is an admin product, show other admin products.
        const { data: adminMatch, error: adminMatchError } = await supabase
          .from('admin_products')
          .select('id')
          .eq('id', product.id)
          .maybeSingle();

        if (adminMatchError && adminMatchError.code !== 'PGRST116') throw adminMatchError;

        if (adminMatch?.id) {
          const { data: adminRelated, error: adminRelatedError } = await supabase
            .from('admin_products')
            .select('*')
            .eq('active', true)
            .neq('id', product.id)
            .order('created_at', { ascending: false })
            .limit(4);

          if (adminRelatedError) throw adminRelatedError;
          const mapped = (adminRelated || []).map(mapAdminToProduct);
          if (!cancelled) setRelatedProducts(mapped);
          return;
        }

        // 2) Otherwise fetch other products from the same seller store.
        const { data: currentRow, error: currentRowError } = await supabase
          .from('products')
          .select('store_id')
          .eq('id', product.id)
          .maybeSingle();

        if (currentRowError && currentRowError.code !== 'PGRST116') throw currentRowError;

        const storeId = currentRow?.store_id;
        if (!storeId) {
          if (!cancelled) setRelatedProducts([]);
          return;
        }

        const { data: sellerRelated, error: sellerRelatedError } = await supabase
          .from('products')
          .select('id,name,price,image_url,category,description,tags,size,stores(name)')
          .eq('store_id', storeId)
          .neq('id', product.id)
          .order('created_at', { ascending: false })
          .limit(4);

        if (sellerRelatedError) throw sellerRelatedError;
        const mapped = (sellerRelated || []).map((p: any) => mapSellerToProduct(p, product.store));
        if (!cancelled) setRelatedProducts(mapped);
      } catch (e) {
        console.warn('Failed to load related products:', e);
        if (!cancelled) setRelatedProducts([]);
      } finally {
        if (!cancelled) setRelatedLoading(false);
      }
    };

    fetchRelated();
    return () => {
      cancelled = true;
    };
  }, [product.id, product.store]);

  const setTimedMessage = (msg: string) => {
    setShareMessage(msg);
    window.setTimeout(() => setShareMessage(null), 2500);
  };

  const handleNativeShare = async () => {
    try {
      if (!navigator.share) return false;
      await navigator.share({
        title: product.name,
        text: sharePayload.shareText,
        url: sharePayload.shareUrl,
      });
      setTimedMessage('Product shared.');
      return true;
    } catch (error: any) {
      if (error?.name === 'AbortError') return true;
      return false;
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${sharePayload.shareText}\n${sharePayload.shareUrl}`);
      setTimedMessage('Link copied.');
    } catch {
      setTimedMessage('Unable to copy link.');
    }
  };

  const openShareLink = (href: string) => {
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const handleShareClick = async () => {
    const usedNative = await handleNativeShare();
    if (!usedNative) {
      // Fallback: copy link immediately, then show share options.
      await handleCopyLink();
      setShareOpen(true);
    }
  };

  return (
    <div className="py-8 md:py-12 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col lg:flex-row gap-8 md:gap-12 mb-16 md:mb-24">
        {/* Image Gallery */}
        <div className="w-full lg:w-1/2 space-y-4">
          <div className="bg-white border-4 border-ink neo-shadow overflow-hidden aspect-square">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          {/* <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white border-2 border-ink neo-shadow-sm aspect-square cursor-pointer hover:neo-shadow transition-all overflow-hidden">
                <img 
                  src={product.image} 
                  alt={`${product.name} view ${i}`}
                  className="w-full h-full object-cover opacity-50 hover:opacity-100 transition-opacity"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div> */}
        </div>

        {/* Product Info */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="bg-secondary-container border-2 border-ink px-2 py-1 font-label text-[10px] font-bold uppercase">{product.category}</span>
              <span className="font-label text-xs font-bold text-ink/50 uppercase tracking-widest">{product.store}</span>
            </div>
            <h1 className="font-headline font-black text-4xl md:text-6xl tracking-tighter uppercase mb-4 leading-none">{product.name}</h1>
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              <span className="font-headline font-black text-3xl md:text-4xl">Rs. {product.price}</span>
              {product.oldPrice && (
                <span className="font-headline font-bold text-2xl text-ink/30 line-through">Rs. {product.oldPrice}</span>
              )}
            </div>
          </div>

          <p className="font-body text-base md:text-lg text-ink/70 mb-6 leading-relaxed">
            {product.description}
          </p>

          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10">
              {product.tags.map(tag => (
                <span key={tag} className="bg-ink text-white px-3 py-1 font-label text-[10px] font-bold uppercase tracking-wider">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-8 mb-12">
            <div>
              <label className="font-label font-bold text-xs uppercase tracking-widest mb-4 block">AVAILABLE SIZE</label>
              <div className="w-14 h-14 border-4 border-ink font-headline font-black text-xl flex items-center justify-center bg-primary-container neo-shadow">
                {product.size || 'N/A'}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <button 
                onClick={() => onAddToCart(product)}
                className="flex-grow bg-primary-container border-4 border-ink py-4 md:py-5 font-headline font-black text-base md:text-xl neo-shadow hover:neo-shadow-lg active-press transition-all flex items-center justify-center gap-3"
              >
                ADD TO CART <ShoppingCart size={24} />
              </button>
              <div className="grid grid-cols-1 gap-2">
              <button
                onClick={handleShareClick}
                className="p-4 md:p-5 border-4 border-ink bg-white neo-shadow hover:neo-shadow-lg active-press transition-all flex items-center justify-center"
              >
                <Share2 size={24} />
              </button>
              {shareMessage && (
                <p className="font-label font-bold text-[10px] uppercase tracking-widest text-ink/50 text-center">
                  {shareMessage}
                </p>
              )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 pt-8 md:pt-12 border-t-4 border-ink/10">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-tertiary" />
              <span className="font-label font-bold text-[10px] uppercase">AUTHENTICITY<br />GUARANTEED</span>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="text-tertiary" />
              <span className="font-label font-bold text-[10px] uppercase">WORLDWIDE<br />SHIPPING</span>
            </div>

          </div>
        </div>
      </div>

      {shareOpen && (
        <div
          className="fixed inset-0 z-[120] bg-ink/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setShareOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg bg-surface border-4 border-ink neo-shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 p-4 sm:p-5 border-b-4 border-ink bg-white">
              <div className="min-w-0">
                <p className="font-label font-bold text-[11px] uppercase tracking-[0.25em] text-ink/50">Share</p>
                <p className="font-headline font-black text-xl uppercase truncate">{product.name}</p>
              </div>
              <button
                onClick={() => setShareOpen(false)}
                className="p-2 border-2 border-ink bg-white hover:bg-secondary-container active-press"
                aria-label="Close share dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div className="border-4 border-ink bg-white p-3">
                <p className="font-label font-bold text-[10px] uppercase tracking-widest text-ink/45 mb-1">Link</p>
                <p className="font-body font-bold text-xs text-ink/70 break-all">{sharePayload.shareUrl}</p>
              </div>
              {shareMessage && (
                <p className="font-label font-bold text-[10px] uppercase tracking-widest text-ink/60 text-center">
                  {shareMessage}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 border-4 border-ink bg-primary-container py-3 font-headline font-black text-sm uppercase neo-shadow hover:opacity-90 active-press"
                >
                  <Copy size={16} /> Copy
                </button>

                <button
                  onClick={() => openShareLink(`mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(`${sharePayload.shareText}\n${sharePayload.shareUrl}`)}`)}
                  className="flex items-center justify-center gap-2 border-4 border-ink bg-white py-3 font-headline font-black text-sm uppercase neo-shadow hover:bg-secondary-container active-press"
                >
                  <Mail size={16} /> Email
                </button>

                <button
                  onClick={() => openShareLink(`https://wa.me/?text=${encodeURIComponent(`${sharePayload.shareText} ${sharePayload.shareUrl}`)}`)}
                  className="flex items-center justify-center gap-2 border-4 border-ink bg-white py-3 font-headline font-black text-sm uppercase neo-shadow hover:bg-secondary-container active-press"
                >
                  <MessageCircle size={16} /> WhatsApp
                </button>

                <button
                  onClick={() => openShareLink(`https://t.me/share/url?url=${encodeURIComponent(sharePayload.shareUrl)}&text=${encodeURIComponent(sharePayload.shareText)}`)}
                  className="flex items-center justify-center gap-2 border-4 border-ink bg-white py-3 font-headline font-black text-sm uppercase neo-shadow hover:bg-secondary-container active-press"
                >
                  <Send size={16} /> Telegram
                </button>

                <button
                  onClick={() => openShareLink(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${sharePayload.shareText} ${sharePayload.shareUrl}`)}`)}
                  className="flex items-center justify-center gap-2 border-4 border-ink bg-white py-3 font-headline font-black text-sm uppercase neo-shadow hover:bg-secondary-container active-press"
                >
                  <Twitter size={16} /> X
                </button>

                <button
                  onClick={async () => {
                    const usedNative = await handleNativeShare();
                    if (usedNative) setShareOpen(false);
                    if (!usedNative) setTimedMessage('Sharing is not supported on this device.');
                  }}
                  className="flex items-center justify-center gap-2 border-4 border-ink bg-white py-3 font-headline font-black text-sm uppercase neo-shadow hover:bg-secondary-container active-press"
                >
                  <Share2 size={16} /> More
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete the Kit */}
      <section className="pt-16 md:pt-24 border-t-4 border-ink">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 md:mb-12">
          <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tighter uppercase">COMPLETE THE KIT</h2>
          <span className="font-label font-bold text-xs text-ink/50 uppercase tracking-widest">
            {relatedLoading ? 'LOADING…' : `MORE FROM ${product.store}`}
          </span>
        </div>
        {relatedLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="bg-white border-4 border-ink neo-shadow p-4 animate-pulse">
                <div className="aspect-square bg-surface-container border-2 border-ink" />
                <div className="mt-4 h-4 bg-surface-container border-2 border-ink" />
                <div className="mt-3 h-4 w-2/3 bg-surface-container border-2 border-ink" />
              </div>
            ))}
          </div>
        ) : relatedProducts.length === 0 ? (
          <div className="bg-white border-4 border-ink neo-shadow p-8 text-center">
            <p className="font-headline font-black text-xl uppercase text-ink/30">NO MORE DROPS FROM THIS STORE</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {relatedProducts.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onAdd={(e) => {
                  e.stopPropagation();
                  onAddToCart(p);
                }}
                onClick={() => onProductClick(p)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
