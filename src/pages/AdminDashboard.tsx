import React, { useState, useEffect, useRef } from 'react';
import { Page, AdminProduct, Store, Order, OrderStatus, Product, ContactInquiry, ContactInquiryStatus } from '../types';
import { Package, Store as StoreIcon, Plus, Trash2, Edit, Loader2, X, LogOut, Upload, Truck, ArrowLeft, MessageSquare } from 'lucide-react';
import { supabase, SUPABASE_STORAGE_BUCKET } from '../supabase';
import { PREDEFINED_TAGS } from '../constants';
import { fetchStoreMetrics } from '../lib/storeMetrics';

interface AdminDashboardProps {
  setPage: (page: Page) => void;
  setIsAdmin: (isAdmin: boolean) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ setPage, setIsAdmin }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'stores' | 'orders' | 'inquiries'>('products');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [savingInquiryId, setSavingInquiryId] = useState<string | null>(null);
  const [orderDrafts, setOrderDrafts] = useState<Record<string, { status: OrderStatus; tracking_id: string; tracking_website: string }>>({});
  const [inquiryDrafts, setInquiryDrafts] = useState<Record<string, ContactInquiryStatus>>({});
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [storeListings, setStoreListings] = useState<Product[]>([]);
  const [storeListingsLoading, setStoreListingsLoading] = useState(false);
  const [deletingStoreId, setDeletingStoreId] = useState<string | null>(null);
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'CLOTHING',
    description: '',
    size: 'M',
    tags: [] as string[],
    imageUrl: '',
    imageFile: null as File | null
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'stores') {
      setSelectedStore(null);
      setStoreListings([]);
    }
  }, [activeTab]);

  useEffect(() => {
    const drafts = orders.reduce<Record<string, { status: OrderStatus; tracking_id: string; tracking_website: string }>>((acc, order) => {
      acc[order.id] = {
        status: order.status,
        tracking_id: order.tracking_id || '',
        tracking_website: order.tracking_website || '',
      };
      return acc;
    }, {});

    setOrderDrafts(drafts);
  }, [orders]);

  useEffect(() => {
    const drafts = inquiries.reduce<Record<string, ContactInquiryStatus>>((acc, inquiry) => {
      acc[inquiry.id] = inquiry.status;
      return acc;
    }, {});

    setInquiryDrafts(drafts);
  }, [inquiries]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'products') {
        const { data, error } = await supabase.from('admin_products').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        
        const formatted = (data || []).map(p => ({
          ...p,
          image: p.image_url,
          store: 'VIKTHRIFTS OFFICIAL'
        }));
        
        setProducts(formatted as AdminProduct[]);
      } else if (activeTab === 'stores') {
        const { data, error } = await supabase.from('stores').select('*');
        if (error) throw error;
        const storeMetrics = await fetchStoreMetrics((data || []).map(store => store.id));
        setStores(data.map(s => ({
          ...s,
          tags: s.tags || [],
          itemCount: storeMetrics.get(s.id)?.itemCount || 0,
          rating: storeMetrics.get(s.id)?.rating || 0,
          ratingCount: storeMetrics.get(s.id)?.ratingCount || 0,
        })));
      } else if (activeTab === 'orders') {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          // Admin should only see orders created from admin product listings.
          .eq('is_admin_order', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders((data || []) as Order[]);
      } else {
        const { data, error } = await supabase
          .from('contact_inquiries')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setInquiries((data || []) as ContactInquiry[]);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreListings = async (store: Store) => {
    setStoreListingsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: Product[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        oldPrice: undefined,
        image: p.image_url,
        category: p.category,
        store: store.name,
        description: p.description,
        tags: p.tags || [],
        size: p.size,
      }));

      setStoreListings(mapped);
    } catch (error: any) {
      console.error('Error fetching store listings:', error);
      alert('Failed to load store listings: ' + (error?.message || 'Unknown error'));
    } finally {
      setStoreListingsLoading(false);
    }
  };

  const openStoreListings = async (store: Store) => {
    setSelectedStore(store);
    await fetchStoreListings(store);
  };

  const handleDeleteStore = async (storeId: string) => {
    const confirmed = confirm('Delete this store and all its products? This cannot be undone.');
    if (!confirmed) return;

    setDeletingStoreId(storeId);
    try {
      const { error } = await supabase.from('stores').delete().eq('id', storeId);
      if (error) throw error;

      if (selectedStore?.id === storeId) {
        setSelectedStore(null);
        setStoreListings([]);
      }

      fetchData();
    } catch (error: any) {
      console.error('Error deleting store:', error);
      alert('Failed to delete store: ' + (error?.message || 'Unknown error'));
    } finally {
      setDeletingStoreId(null);
    }
  };

  const handleDeleteStoreListing = async (productId: string) => {
    if (!selectedStore) return;

    const confirmed = confirm('Delete this product listing? This cannot be undone.');
    if (!confirmed) return;

    setDeletingListingId(productId);
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;

      setStoreListings(prev => prev.filter(p => p.id !== productId));
    } catch (error: any) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing: ' + (error?.message || 'Unknown error'));
    } finally {
      setDeletingListingId(null);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `admin_products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrl = formData.imageUrl;
      if (formData.imageFile) {
        imageUrl = await handleImageUpload(formData.imageFile);
      }

      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        description: formData.description,
        size: formData.size,
        image_url: imageUrl,
        tags: formData.tags,
        active: true
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('admin_products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('admin_products')
          .insert([productData]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving product:', error);
      alert('Failed to save product: ' + (error.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const { error } = await supabase.from('admin_products').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product: ' + ((error as any)?.message || 'Unknown error'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category: 'CLOTHING',
      description: '',
      size: 'M',
      tags: [],
      imageUrl: '',
      imageFile: null
    });
    setEditingProduct(null);
  };

  const openEditModal = (product: AdminProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      description: product.description,
      size: product.size || 'M',
      tags: product.tags || [],
      imageUrl: product.image || '',
      imageFile: null
    });
    setIsModalOpen(true);
  };

  const updateOrderDraft = (orderId: string, field: 'status' | 'tracking_id' | 'tracking_website', value: string) => {
    setOrderDrafts(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value,
      },
    }));
  };

  const handleSaveOrder = async (orderId: string) => {
    const draft = orderDrafts[orderId];
    if (!draft) return;

    setSavingOrderId(orderId);

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: draft.status,
          tracking_id: draft.tracking_id.trim() || null,
          tracking_website: draft.tracking_website.trim() || null,
        })
        .eq('id', orderId);

      if (error) throw error;
      fetchData();
    } catch (saveError) {
      console.error('Error updating order:', saveError);
    } finally {
      setSavingOrderId(null);
    }
  };

  const updateInquiryDraft = (inquiryId: string, status: ContactInquiryStatus) => {
    setInquiryDrafts(prev => ({
      ...prev,
      [inquiryId]: status,
    }));
  };

  const handleSaveInquiry = async (inquiryId: string) => {
    const status = inquiryDrafts[inquiryId];
    if (!status) return;

    setSavingInquiryId(inquiryId);

    try {
      const { error } = await supabase
        .from('contact_inquiries')
        .update({ status })
        .eq('id', inquiryId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating inquiry:', error);
    } finally {
      setSavingInquiryId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-surface">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-ink text-white p-6 flex flex-col gap-8 border-r-4 border-ink">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-tertiary text-white flex items-center justify-center border-2 border-white">
            A
          </div>
          <h1 className="font-headline font-black text-xl uppercase">ADMIN PANEL</h1>
        </div>

        <nav className="space-y-2">
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-headline font-black text-sm border-2 transition-colors ${activeTab === 'products' ? 'bg-white text-ink border-white' : 'border-transparent text-white/60 hover:bg-white/10'}`}
          >
            <Package size={18} /> PRODUCTS
          </button>
          <button 
            onClick={() => setActiveTab('stores')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-headline font-black text-sm border-2 transition-colors ${activeTab === 'stores' ? 'bg-white text-ink border-white' : 'border-transparent text-white/60 hover:bg-white/10'}`}
          >
            <StoreIcon size={18} /> STORES
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-headline font-black text-sm border-2 transition-colors ${activeTab === 'orders' ? 'bg-white text-ink border-white' : 'border-transparent text-white/60 hover:bg-white/10'}`}
          >
            <Truck size={18} /> ORDERS
          </button>
          <button 
            onClick={() => setActiveTab('inquiries')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-headline font-black text-sm border-2 transition-colors ${activeTab === 'inquiries' ? 'bg-white text-ink border-white' : 'border-transparent text-white/60 hover:bg-white/10'}`}
          >
            <MessageSquare size={18} /> INQUIRIES
          </button>
        </nav>

        <div className="mt-auto pt-8 border-t border-white/10">
          <button 
            onClick={() => {
              setIsAdmin(false);
              setPage('home');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:text-tertiary transition-colors font-label font-bold text-xs text-white/40"
          >
            <LogOut size={14} /> LOGOUT
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {activeTab === 'products' ? (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <h2 className="font-headline font-black text-3xl sm:text-4xl uppercase">ADMIN INVENTORY</h2>
              <button 
                onClick={() => { resetForm(); setIsModalOpen(true); }}
                className="w-full sm:w-auto bg-primary-container border-4 border-ink px-5 sm:px-6 py-3 font-headline font-black text-sm neo-shadow hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Plus size={20} /> ADD PRODUCT
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
            ) : (
              <div className="bg-white border-4 border-ink neo-shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left">
                  <thead className="bg-surface-container border-b-4 border-ink font-label font-bold text-xs uppercase">
                    <tr>
                      <th className="p-4">PRODUCT</th>
                      <th className="p-4">CATEGORY</th>
                      <th className="p-4">SIZE</th>
                      <th className="p-4">PRICE</th>
                      <th className="p-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-ink/10">
                    {products.map(product => (
                      <tr key={product.id} className="hover:bg-surface-container/30">
                        <td className="p-4 flex items-center gap-4">
                          <div className="w-10 h-10 bg-surface-container border-2 border-ink overflow-hidden">
                            {product.image && <img src={product.image} className="w-full h-full object-cover" />}
                          </div>
                          <span className="font-headline font-bold uppercase">{product.name}</span>
                        </td>
                        <td className="p-4 font-label text-xs font-bold">{product.category}</td>
                        <td className="p-4 font-label text-xs font-bold">{product.size}</td>
                        <td className="p-4 font-headline font-bold">${product.price}</td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button onClick={() => openEditModal(product)} className="p-2 border-2 border-ink hover:bg-secondary-container transition-colors"><Edit size={16} /></button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="p-2 border-2 border-ink hover:bg-tertiary hover:text-white transition-colors"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'stores' ? (
          <div>
            {selectedStore ? (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                  <div className="min-w-0">
                    <button
                      onClick={() => {
                        setSelectedStore(null);
                        setStoreListings([]);
                      }}
                      className="inline-flex items-center gap-2 font-label font-bold text-xs uppercase tracking-widest text-ink/60 hover:text-ink transition-colors mb-3"
                    >
                      <ArrowLeft size={16} /> Back to Stores
                    </button>
                    <h2 className="font-headline font-black text-3xl sm:text-4xl uppercase truncate">{selectedStore.name}</h2>
                    <p className="font-body font-bold text-ink/50 mt-2">Manage listings for this store.</p>
                  </div>

                  <button
                    onClick={() => handleDeleteStore(selectedStore.id)}
                    disabled={deletingStoreId === selectedStore.id}
                    className="w-full sm:w-auto bg-tertiary text-white border-4 border-ink px-6 py-3 font-headline font-black text-sm neo-shadow hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {deletingStoreId === selectedStore.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                    DELETE STORE
                  </button>
                </div>

                {storeListingsLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
                ) : storeListings.length === 0 ? (
                  <div className="bg-white border-4 border-ink p-8 neo-shadow text-center">
                    <p className="font-headline font-black text-xl uppercase text-ink/30">NO LISTINGS YET</p>
                  </div>
                ) : (
                  <div className="bg-white border-4 border-ink neo-shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] text-left">
                        <thead className="bg-surface-container border-b-4 border-ink font-label font-bold text-xs uppercase">
                          <tr>
                            <th className="p-4">PRODUCT</th>
                            <th className="p-4">CATEGORY</th>
                            <th className="p-4">SIZE</th>
                            <th className="p-4">PRICE</th>
                            <th className="p-4 text-right">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-ink/10">
                          {storeListings.map(listing => (
                            <tr key={listing.id} className="hover:bg-surface-container/30">
                              <td className="p-4 flex items-center gap-4">
                                <div className="w-10 h-10 bg-surface-container border-2 border-ink overflow-hidden">
                                  {listing.image && <img src={listing.image} className="w-full h-full object-cover" />}
                                </div>
                                <span className="font-headline font-bold uppercase">{listing.name}</span>
                              </td>
                              <td className="p-4 font-label text-xs font-bold">{listing.category}</td>
                              <td className="p-4 font-label text-xs font-bold">{listing.size || 'N/A'}</td>
                              <td className="p-4 font-headline font-bold">Rs. {listing.price}</td>
                              <td className="p-4 text-right flex justify-end gap-2">
                                <button
                                  onClick={() => handleDeleteStoreListing(listing.id)}
                                  disabled={deletingListingId === listing.id}
                                  className="p-2 border-2 border-ink hover:bg-tertiary hover:text-white transition-colors disabled:opacity-60"
                                  title="Delete listing"
                                >
                                  {deletingListingId === listing.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <h2 className="font-headline font-black text-3xl sm:text-4xl uppercase mb-8">REGISTERED STORES</h2>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {stores.map(store => (
                  <div key={store.id} className="bg-white border-4 border-ink p-5 sm:p-6 neo-shadow">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 ${store.color} border-2 border-ink flex items-center justify-center font-headline font-black text-lg`}>
                        {store.initials}
                      </div>
                      <div>
                        <h3 className="font-headline font-black text-lg uppercase">{store.name}</h3>
                        <p className="font-label text-xs text-ink/50">{store.tags.join(', ')}</p>
                      </div>
                    </div>
                    <p className="font-body text-sm text-ink/70 mb-4 line-clamp-2">{store.description}</p>
                    <div className="flex items-center justify-between gap-3">
                      <button
                        onClick={() => openStoreListings(store)}
                        className="bg-primary-container border-2 border-ink px-4 py-2 font-label font-bold text-[11px] uppercase tracking-widest neo-shadow-sm hover:opacity-90 transition-opacity"
                      >
                        View Listings
                      </button>
                      <button
                        onClick={() => handleDeleteStore(store.id)}
                        disabled={deletingStoreId === store.id}
                        className="p-2 border-2 border-ink hover:bg-tertiary hover:text-white transition-colors disabled:opacity-60"
                        title="Delete store"
                      >
                        {deletingStoreId === store.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
              </>
            )}
          </div>
        ) : activeTab === 'orders' ? (
          <div>
            <h2 className="font-headline font-black text-3xl sm:text-4xl uppercase mb-8">ORDER MONITORING</h2>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
            ) : orders.length === 0 ? (
              <div className="bg-white border-4 border-ink p-8 sm:p-12 neo-shadow text-center">
                <p className="font-headline font-black text-xl sm:text-2xl uppercase text-ink/30">No Orders Yet</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-5">
                {orders.map(order => {
                  const draft = orderDrafts[order.id] || {
                    status: order.status,
                    tracking_id: order.tracking_id || '',
                    tracking_website: order.tracking_website || '',
                  };

                  return (
                    <div key={order.id} className="bg-white border-4 border-ink neo-shadow p-4 sm:p-6">
                      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <h3 className="font-headline font-black text-xl sm:text-2xl uppercase">{order.product_name}</h3>
                            <span className="px-3 py-1 border-2 border-ink bg-secondary-container font-label font-bold text-[10px] uppercase tracking-widest">
                              {order.store_name}
                            </span>
                          </div>
                          <p className="font-body font-bold text-sm text-ink/60">
                            Receiver: {order.receiver_name} • {order.receiver_contact_number} • {order.receiver_pincode}
                          </p>
                          <p className="font-body font-bold text-sm text-ink/60 mt-1">
                            Address: {order.receiver_address}
                          </p>
                          <p className="font-label font-bold text-[10px] uppercase tracking-widest text-ink/40 mt-3">
                            {new Date(order.created_at).toLocaleString()} • {order.payment_method} • {order.return_policy}
                          </p>
                        </div>

                        <div className="font-headline font-black text-2xl sm:text-3xl">Rs. {order.product_price}</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="space-y-2">
                          <label className="font-label font-bold text-xs uppercase tracking-widest">Status</label>
                          <select
                            className="w-full bg-surface border-4 border-ink p-3 font-bold"
                            value={draft.status}
                            onChange={(e) => updateOrderDraft(order.id, 'status', e.target.value)}
                          >
                            <option value="pending">PENDING</option>
                            <option value="processing">PROCESSING</option>
                            <option value="shipped">SHIPPED</option>
                            <option value="delivered">DELIVERED</option>
                            <option value="completed">COMPLETED</option>
                            <option value="cancelled">CANCELLED</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="font-label font-bold text-xs uppercase tracking-widest">Tracking ID</label>
                          <input
                            type="text"
                            className="w-full bg-surface border-4 border-ink p-3 font-bold"
                            value={draft.tracking_id}
                            onChange={(e) => updateOrderDraft(order.id, 'tracking_id', e.target.value)}
                            placeholder="AWB123456789"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="font-label font-bold text-xs uppercase tracking-widest">Tracking Website</label>
                          <input
                            type="text"
                            className="w-full bg-surface border-4 border-ink p-3 font-bold"
                            value={draft.tracking_website}
                            onChange={(e) => updateOrderDraft(order.id, 'tracking_website', e.target.value)}
                            placeholder="Delhivery / Blue Dart / URL"
                          />
                        </div>
                      </div>

                      <div className="mt-5 flex justify-stretch sm:justify-end">
                        <button
                          onClick={() => handleSaveOrder(order.id)}
                          disabled={savingOrderId === order.id}
                          className="w-full sm:w-auto bg-primary-container border-4 border-ink px-6 py-3 font-headline font-black text-sm neo-shadow hover:opacity-90 transition-opacity disabled:opacity-60"
                        >
                          {savingOrderId === order.id ? <Loader2 className="animate-spin" size={18} /> : 'SAVE ORDER UPDATE'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="font-headline font-black text-3xl sm:text-4xl uppercase mb-8">CONTACT INQUIRIES</h2>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
            ) : inquiries.length === 0 ? (
              <div className="bg-white border-4 border-ink p-8 sm:p-12 neo-shadow text-center">
                <p className="font-headline font-black text-xl sm:text-2xl uppercase text-ink/30">No Inquiries Yet</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-5">
                {inquiries.map(inquiry => (
                  <div key={inquiry.id} className="bg-white border-4 border-ink neo-shadow p-4 sm:p-6">
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h3 className="font-headline font-black text-xl sm:text-2xl uppercase">{inquiry.name}</h3>
                          <span className="px-3 py-1 border-2 border-ink bg-secondary-container font-label font-bold text-[10px] uppercase tracking-widest">
                            {inquiry.topic}
                          </span>
                        </div>
                        <p className="font-body font-bold text-sm text-ink/60">{inquiry.email}</p>
                        <p className="font-body font-bold text-sm text-ink/60 mt-1">
                          {new Date(inquiry.created_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="min-w-[180px]">
                        <label className="font-label font-bold text-xs uppercase tracking-widest mb-2 block">Status</label>
                        <select
                          className="w-full bg-surface border-4 border-ink p-3 font-bold uppercase"
                          value={inquiryDrafts[inquiry.id] || inquiry.status}
                          onChange={(e) => updateInquiryDraft(inquiry.id, e.target.value as ContactInquiryStatus)}
                        >
                          <option value="new">NEW</option>
                          <option value="in_progress">IN PROGRESS</option>
                          <option value="resolved">RESOLVED</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-5 border-4 border-ink bg-surface-container p-4">
                      <p className="font-label font-bold text-[11px] uppercase tracking-widest text-ink/50 mb-2">Message</p>
                      <p className="font-body font-bold text-sm text-ink/75 whitespace-pre-wrap">{inquiry.message}</p>
                    </div>

                    <div className="mt-5 flex justify-stretch sm:justify-end">
                      <button
                        onClick={() => handleSaveInquiry(inquiry.id)}
                        disabled={savingInquiryId === inquiry.id}
                        className="w-full sm:w-auto bg-primary-container border-4 border-ink px-6 py-3 font-headline font-black text-sm neo-shadow hover:opacity-90 transition-opacity disabled:opacity-60"
                      >
                        {savingInquiryId === inquiry.id ? <Loader2 className="animate-spin" size={18} /> : 'SAVE STATUS'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border-4 border-ink w-full max-w-2xl max-h-[90vh] overflow-y-auto neo-shadow-lg p-5 sm:p-8">
            <div className="flex justify-between items-center gap-4 mb-6">
              <h2 className="font-headline font-black text-2xl sm:text-3xl uppercase">{editingProduct ? 'EDIT PRODUCT' : 'ADD NEW DROP'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label font-bold text-xs uppercase">PRODUCT NAME</label>
                  <input type="text" required className="w-full border-4 border-ink p-3 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="font-label font-bold text-xs uppercase">PRICE ($)</label>
                  <input type="number" required className="w-full border-4 border-ink p-3 font-bold" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label font-bold text-xs uppercase">CATEGORY</label>
                  <select className="w-full border-4 border-ink p-3 font-bold bg-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option>CLOTHING</option>
                    <option>FOOTWEAR</option>
                    <option>ACCESSORIES</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-label font-bold text-xs uppercase">SIZE</label>
                  <select className="w-full border-4 border-ink p-3 font-bold bg-white" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})}>
                    <option>S</option>
                    <option>M</option>
                    <option>L</option>
                    <option>XL</option>
                    <option>2XL</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-label font-bold text-xs uppercase tracking-widest">PRODUCT TAGS</label>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const newTags = formData.tags.includes(tag)
                          ? formData.tags.filter(t => t !== tag)
                          : [...formData.tags, tag];
                        setFormData({ ...formData, tags: newTags });
                      }}
                      className={`px-3 py-1 border-2 border-ink font-label font-bold text-[10px] transition-colors ${formData.tags.includes(tag) ? 'bg-primary-container' : 'bg-white'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-label font-bold text-xs uppercase">DESCRIPTION</label>
                <textarea required rows={3} className="w-full border-4 border-ink p-3 font-bold" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="font-label font-bold text-xs uppercase">IMAGE</label>
                <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-ink/30 p-8 text-center cursor-pointer hover:bg-white transition-colors">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} className="h-32 mx-auto object-contain" />
                  ) : (
                    <div className="text-ink/40"><Upload className="mx-auto mb-2" /> CLICK TO UPLOAD</div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData({...formData, imageFile: file, imageUrl: URL.createObjectURL(file)});
                  }
                }} />
              </div>

              <button type="submit" disabled={uploading} className="w-full bg-primary-container border-4 border-ink py-4 font-headline font-black text-xl hover:opacity-90">
                {uploading ? <Loader2 className="animate-spin mx-auto" /> : (editingProduct ? 'UPDATE PRODUCT' : 'CREATE DROP')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
