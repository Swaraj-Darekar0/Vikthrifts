import React, { useEffect, useRef, useState } from 'react';
import { Order, Page } from '../types';
import { User, Mail, Shield, LogOut, Loader2, Package, Truck, Upload } from 'lucide-react';
import { supabase } from '../supabase';

interface ProfileProps {
  setPage: (page: Page) => void;
}

export const Profile: React.FC<ProfileProps> = ({ setPage }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setPage('auth-choice');
          return;
        }

        setEmail(user.email || null);
        setUserId(user.id);

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(data);
        }

        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
        } else {
          setOrders((ordersData || []) as Order[]);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [setPage]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setPage('home');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setAvatarUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${userId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('thredz')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('thredz').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setProfile((prev: any) => ({
        ...prev,
        avatar_url: data.publicUrl,
      }));
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
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
    <div className="min-h-screen bg-surface py-10 md:py-16 px-4 md:px-8 max-w-4xl mx-auto">
      <h1 className="font-headline font-black text-4xl sm:text-5xl md:text-6xl tracking-tighter uppercase mb-8 md:mb-12 text-center">MY PROFILE</h1>

      <div className="bg-white border-4 border-ink p-5 sm:p-6 md:p-12 neo-shadow relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary-container rounded-full opacity-20 blur-3xl"></div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start relative z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-28 h-28 md:w-32 md:h-32 bg-primary-container border-4 border-ink flex items-center justify-center flex-shrink-0 neo-shadow-sm overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile?.full_name || 'Profile avatar'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={64} className="text-ink" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="flex items-center gap-2 bg-white border-4 border-ink px-4 py-3 font-label font-bold text-[11px] uppercase tracking-widest neo-shadow disabled:opacity-60"
            >
              {avatarUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              {avatarUploading ? 'Uploading' : 'Update Avatar'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="flex-grow space-y-6 w-full">
            <div>
              <span className="font-label font-bold text-xs uppercase tracking-widest text-ink/50 block mb-2">FULL NAME</span>
              <h2 className="font-headline font-black text-3xl md:text-4xl uppercase">{profile?.full_name || 'Anonymous User'}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-container border-2 border-ink p-4">
                <div className="flex items-center gap-3 mb-2 text-ink/60">
                  <Mail size={18} />
                  <span className="font-label font-bold text-xs uppercase">EMAIL ADDRESS</span>
                </div>
                <p className="font-headline font-bold text-lg">{email}</p>
              </div>

              <div className="bg-surface-container border-2 border-ink p-4">
                <div className="flex items-center gap-3 mb-2 text-ink/60">
                  <Shield size={18} />
                  <span className="font-label font-bold text-xs uppercase">ACCOUNT TYPE</span>
                </div>
                <p className="font-headline font-bold text-lg uppercase">{profile?.role || 'BUYER'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 md:mt-12 pt-8 border-t-4 border-ink/10 flex justify-end">
          <button 
            onClick={handleSignOut}
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white border-4 border-ink px-6 md:px-8 py-4 font-headline font-black text-base md:text-xl hover:bg-tertiary hover:text-white transition-all neo-shadow active-press"
          >
            SIGN OUT <LogOut size={24} />
          </button>
        </div>
      </div>

      <div className="mt-8 md:mt-10 bg-white border-4 border-ink p-5 sm:p-6 md:p-10 neo-shadow">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="font-label font-bold text-xs uppercase tracking-[0.25em] text-ink/50 mb-3">Orders</p>
            <h2 className="font-headline font-black text-3xl md:text-4xl uppercase">My Orders</h2>
          </div>
          <p className="font-body font-bold text-ink/50">
            Track every order, its current status, and the shipment reference once it is dispatched.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 border-4 border-dashed border-ink/20 bg-surface-container/30">
            <Package size={48} className="mx-auto text-ink/20 mb-4" />
            <p className="font-headline font-black text-2xl uppercase text-ink/30">No Orders Yet</p>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map(order => (
              <div key={order.id} className="border-4 border-ink bg-surface-container/40 p-5">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-20 h-20 border-2 border-ink overflow-hidden bg-white flex-shrink-0">
                      {order.product_image_url ? (
                        <img src={order.product_image_url} alt={order.product_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink/20">
                          <Package size={28} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-headline font-black text-2xl uppercase truncate">{order.product_name}</p>
                      <p className="font-label font-bold text-[10px] uppercase tracking-widest text-ink/50">
                        {order.store_name} • {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      <p className="font-body font-bold text-sm text-ink/60 mt-2">
                        Receiver: {order.receiver_name} • Pincode: {order.receiver_pincode}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start lg:items-end gap-3">
                    <span className="px-3 py-2 border-2 border-ink bg-primary-container font-label font-bold text-[10px] uppercase tracking-widest">
                      {order.status}
                    </span>
                    <span className="font-headline font-black text-2xl">Rs. {order.product_price}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                  <div className="bg-white border-2 border-ink p-4">
                    <p className="font-label font-bold text-[10px] uppercase tracking-widest text-ink/50 mb-2">Payment</p>
                    <p className="font-headline font-black text-lg uppercase">{order.payment_method}</p>
                  </div>
                  <div className="bg-white border-2 border-ink p-4">
                    <p className="font-label font-bold text-[10px] uppercase tracking-widest text-ink/50 mb-2">Returns</p>
                    <p className="font-headline font-black text-lg uppercase">{order.return_policy}</p>
                  </div>
                  <div className="bg-white border-2 border-ink p-4">
                    <div className="flex items-center gap-2 mb-2 text-ink/50">
                      <Truck size={14} />
                      <p className="font-label font-bold text-[10px] uppercase tracking-widest">Tracking</p>
                    </div>
                    {order.tracking_id ? (
                      <>
                        <p className="font-headline font-black text-lg uppercase break-words">{order.tracking_id}</p>
                        <p className="font-body font-bold text-sm text-ink/60 break-words">{order.tracking_website || 'Tracking site pending'}</p>
                      </>
                    ) : (
                      <p className="font-body font-bold text-sm text-ink/50">Tracking details will appear once the seller dispatches this order.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
