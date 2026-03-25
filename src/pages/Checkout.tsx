import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, MapPin, PackageCheck, Phone, ShieldAlert, Truck, User } from 'lucide-react';
import { Page, Product } from '../types';
import { supabase } from '../supabase';

interface CheckoutProps {
  items: Product[];
  setPage: (page: Page) => void;
  onOrderPlaced: () => void;
}

const ADMIN_STORE_LABEL = 'VIKTHRIFTS OFFICIAL';

const generateOrderGroupId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0'));
    return [
      hex.slice(0, 4).join(''),
      hex.slice(4, 6).join(''),
      hex.slice(6, 8).join(''),
      hex.slice(8, 10).join(''),
      hex.slice(10, 16).join(''),
    ].join('-');
  }

  throw new Error('Secure UUID generation is unavailable in this browser.');
};

export const Checkout: React.FC<CheckoutProps> = ({ items, setPage, onOrderPlaced }) => {
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    receiverName: '',
    receiverAddress: '',
    receiverContactNumber: '',
    receiverPincode: '',
  });

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.price, 0), [items]);
  const shipping = items.length > 0 ? 15 : 0;
  const total = subtotal + shipping;

  useEffect(() => {
    const loadBuyer = async () => {
      if (items.length === 0) {
        setPage('cart');
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setPage('auth-choice');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();

        setFormData(prev => ({
          ...prev,
          receiverName: profile?.full_name || user.user_metadata?.full_name || '',
        }));
      } catch (fetchError) {
        console.error('Error loading buyer profile:', fetchError);
      } finally {
        setLoading(false);
      }
    };

    loadBuyer();
  }, [items.length, setPage]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlacingOrder(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setPage('auth-choice');
        return;
      }

      const uniqueStoreNames = [...new Set(
        items
          .filter(item => item.store !== ADMIN_STORE_LABEL)
          .map(item => item.store)
      )];

      const storeLookup = new Map<string, { id: string; owner_id: string | null }>();

      if (uniqueStoreNames.length > 0) {
        const { data: storesData, error: storesError } = await supabase
          .from('stores')
          .select('id, name, owner_id')
          .in('name', uniqueStoreNames);

        if (storesError) throw storesError;

        (storesData || []).forEach(store => {
          storeLookup.set(store.name, { id: store.id, owner_id: store.owner_id || null });
        });
      }

      const orderGroupId = generateOrderGroupId();

      const orderRows = items.map(item => {
        const isAdminOrder = item.store === ADMIN_STORE_LABEL;
        const storeData = isAdminOrder ? null : storeLookup.get(item.store);

        return {
          order_group_id: orderGroupId,
          buyer_id: user.id,
          product_id: isAdminOrder ? null : item.id,
          admin_product_id: isAdminOrder ? item.id : null,
          product_name: item.name,
          product_image_url: item.image,
          product_price: item.price,
          product_size: item.size || null,
          store_id: storeData?.id || null,
          store_name: isAdminOrder ? 'ADMIN' : item.store,
          seller_id: isAdminOrder ? null : (storeData?.owner_id || null),
          is_admin_order: isAdminOrder,
          receiver_name: formData.receiverName.trim(),
          receiver_address: formData.receiverAddress.trim(),
          receiver_contact_number: formData.receiverContactNumber.trim(),
          receiver_pincode: formData.receiverPincode.trim(),
          payment_method: 'Cash on Delivery',
          return_policy: 'No Returns',
          status: 'pending',
        };
      });

      const { error: insertError } = await supabase
        .from('orders')
        .insert(orderRows);

      if (insertError) throw insertError;

      onOrderPlaced();
      setPage('profile');
    } catch (placeError: any) {
      console.error('Error placing order:', placeError);
      setError(placeError.message || 'Failed to place the order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="animate-spin text-ink" size={48} />
      </div>
    );
  }

  return (
    <div className="py-10 md:py-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-12">
        <div>
          <p className="font-label font-bold text-xs uppercase tracking-[0.25em] text-ink/50 mb-3">Checkout</p>
          <h1 className="font-headline font-black text-4xl md:text-7xl tracking-tighter uppercase">Receiver Details</h1>
        </div>

        <button
          onClick={() => setPage('cart')}
          className="flex items-center gap-2 border-4 border-ink bg-white px-5 py-3 font-label font-bold text-xs uppercase tracking-widest neo-shadow"
        >
          <ArrowLeft size={16} /> Back To Cart
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6 md:gap-10">
        <form onSubmit={handlePlaceOrder} className="bg-white border-4 border-ink neo-shadow p-5 sm:p-6 md:p-10 space-y-5 md:space-y-6">
          {error && (
            <div className="bg-red-100 border-4 border-red-500 text-red-700 p-4 font-label font-bold text-xs uppercase tracking-widest">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-label font-bold text-xs uppercase tracking-widest">Receiver Name</label>
              <div className="flex items-center bg-surface border-4 border-ink p-3 md:p-4">
                <User size={18} className="text-ink/40" />
                <input
                  type="text"
                  className="w-full bg-transparent border-none outline-none px-3 font-body font-bold"
                  value={formData.receiverName}
                  onChange={(e) => setFormData(prev => ({ ...prev, receiverName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-label font-bold text-xs uppercase tracking-widest">Contact Number</label>
              <div className="flex items-center bg-surface border-4 border-ink p-3 md:p-4">
                <Phone size={18} className="text-ink/40" />
                <input
                  type="tel"
                  className="w-full bg-transparent border-none outline-none px-3 font-body font-bold"
                  value={formData.receiverContactNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, receiverContactNumber: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-label font-bold text-xs uppercase tracking-widest">Receiver Address</label>
            <div className="flex items-start bg-surface border-4 border-ink p-3 md:p-4">
              <MapPin size={18} className="text-ink/40 mt-1" />
              <textarea
                rows={5}
                className="w-full bg-transparent border-none outline-none px-3 font-body font-bold resize-none"
                value={formData.receiverAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, receiverAddress: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-label font-bold text-xs uppercase tracking-widest">Pincode</label>
            <input
              type="text"
              className="w-full bg-surface border-4 border-ink p-3 md:p-4 font-body font-bold outline-none"
              value={formData.receiverPincode}
              onChange={(e) => setFormData(prev => ({ ...prev, receiverPincode: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="border-4 border-ink bg-primary-container p-5">
              <p className="font-label font-bold text-[11px] uppercase tracking-widest mb-2">Payment</p>
              <div className="flex items-center gap-2 md:gap-3">
                <PackageCheck size={20} />
                <span className="font-headline font-black text-xl uppercase">Cash On Delivery</span>
              </div>
            </div>

            <div className="border-4 border-ink bg-secondary-container p-5">
              <p className="font-label font-bold text-[11px] uppercase tracking-widest mb-2">Policy</p>
              <div className="flex items-center gap-2 md:gap-3">
                <ShieldAlert size={20} />
                <span className="font-headline font-black text-xl uppercase">No Returns</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={placingOrder || items.length === 0}
            className="w-full bg-ink text-white py-4 md:py-5 font-headline font-black text-base md:text-xl border-4 border-ink neo-shadow hover:bg-tertiary transition-all active-press flex items-center justify-center gap-3 disabled:opacity-60"
          >
            {placingOrder ? <Loader2 className="animate-spin" size={24} /> : 'PLACE ORDER'}
          </button>
        </form>

        <div className="space-y-6">
          <div className="bg-secondary-container border-4 border-ink p-5 sm:p-6 md:p-8 neo-shadow-lg">
            <h2 className="font-headline font-black text-2xl md:text-3xl uppercase mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              {items.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex items-center gap-4 border-b-2 border-ink/10 pb-4">
                  <div className="w-16 h-16 border-2 border-ink overflow-hidden bg-white flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="min-w-0 flex-grow">
                    <p className="font-headline font-black text-lg uppercase truncate">{item.name}</p>
                    <p className="font-label font-bold text-[10px] uppercase tracking-widest text-ink/50">
                      {item.store === ADMIN_STORE_LABEL ? 'ADMIN' : item.store}
                    </p>
                  </div>
                  <span className="font-headline font-black text-lg">Rs. {item.price}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between font-body text-lg">
                <span className="text-ink/60">Subtotal</span>
                <span className="font-bold">Rs. {subtotal}</span>
              </div>
              <div className="flex justify-between font-body text-lg">
                <span className="text-ink/60">Shipping</span>
                <span className="font-bold">Rs. {shipping}</span>
              </div>
              <div className="pt-4 border-t-2 border-ink flex justify-between font-headline font-black text-2xl">
                <span>Total</span>
                <span>Rs. {total}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border-4 border-ink p-6 neo-shadow">
            <div className="flex items-center gap-3 mb-3">
              <Truck size={20} className="text-tertiary" />
              <p className="font-headline font-black text-xl uppercase">Tracking Updates</p>
            </div>
            <p className="font-body font-bold text-ink/60">
              Once the seller or admin ships your order, your tracking ID and tracking website will appear in your profile orders section.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
