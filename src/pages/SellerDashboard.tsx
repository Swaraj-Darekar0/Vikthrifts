import React, { useState, useEffect, useRef } from 'react';
import { Page, Product, Store, Order, OrderStatus } from '../types';
import { Plus, Upload, X, ArrowLeft, LayoutDashboard, Package, Settings, Loader2, Store as StoreIcon, Edit, Truck } from 'lucide-react';
import { supabase } from '../supabase';
import { PREDEFINED_TAGS } from '../constants';
import { fetchStoreMetrics } from '../lib/storeMetrics';

interface SellerDashboardProps {
  setPage: (page: Page) => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({ setPage }) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  
  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [orderDrafts, setOrderDrafts] = useState<Record<string, { status: OrderStatus; tracking_id: string; tracking_website: string }>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storeImageInputRef = useRef<HTMLInputElement>(null);

  // Store Form State
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState<'clothing' | 'accessories'>('clothing');
  const [storeDescription, setStoreDescription] = useState('');
  const [storeImage, setStoreImage] = useState<File | null>(null);
  const [storeImageUrl, setStoreImageUrl] = useState('');

  // Product Form State
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategory, setProductCategory] = useState('CLOTHING');
  const [productSize, setProductSize] = useState('M');
  const [productTags, setProductTags] = useState<string[]>([]);
  const [productDescription, setProductDescription] = useState('');
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImageUrl, setProductImageUrl] = useState('');

  useEffect(() => {
    fetchStoreAndProducts();
  }, []);

  const fetchStoreAndProducts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPage('auth-seller');
        return;
      }

      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (storeError && storeError.code !== 'PGRST116') throw storeError;

      if (storeData) {
        const storeMetrics = await fetchStoreMetrics([storeData.id]);
        const currentMetrics = storeMetrics.get(storeData.id);

        setStore({
          id: storeData.id,
          name: storeData.name,
          initials: storeData.initials,
          color: storeData.color,
          category: storeData.category || 'clothing',
          tags: storeData.tags || [],
          description: storeData.description,
          itemCount: currentMetrics?.itemCount || 0,
          rating: currentMetrics?.rating || 0,
          ratingCount: currentMetrics?.ratingCount || 0,
          image: storeData.image_url
        });

        // Pre-fill settings form
        setStoreName(storeData.name);
        setStoreCategory(storeData.category || 'clothing');
        setStoreDescription(storeData.description || '');
        setStoreImageUrl(storeData.image_url || '');

        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeData.id);

        if (productsError) throw productsError;

        const formattedProducts: Product[] = productsData.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.image_url,
          category: p.category,
          store: storeData.name,
          description: p.description,
          tags: p.tags || []
        }));

        setProducts(formattedProducts);
        setStore(prev => prev ? {
          ...prev,
          itemCount: formattedProducts.length,
          rating: currentMetrics?.rating || 0,
          ratingCount: currentMetrics?.ratingCount || 0,
        } : null);

        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        setOrders((ordersData || []) as Order[]);
      } else {
        setIsCreatingStore(true);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, path: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('VIKTHRIFTS')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('VIKTHRIFTS').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let imageUrl = storeImageUrl;
      if (storeImage) {
        imageUrl = await handleImageUpload(storeImage, 'stores');
      }

      const initials = storeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      const colors = ['bg-primary-container', 'bg-secondary-container', 'bg-[#ffb3ac]', 'bg-tertiary'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const { error } = await supabase.from('stores').insert([{
        owner_id: user.id,
        name: storeName,
        category: storeCategory,
        description: storeDescription,
        image_url: imageUrl,
        initials,
        color: randomColor,
        tags: ['NEW']
      }]);

      if (error) throw error;
      setIsCreatingStore(false);
      fetchStoreAndProducts();
    } catch (error) {
      console.error('Error creating store:', error);
      alert('Failed to create store.');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    setUploading(true);
    try {
      let imageUrl = storeImageUrl;
      if (storeImage) {
        imageUrl = await handleImageUpload(storeImage, 'stores');
      }

      const { error } = await supabase.from('stores').update({
        name: storeName,
        category: storeCategory,
        description: storeDescription,
        image_url: imageUrl
      }).eq('id', store.id);

      if (error) throw error;
      setIsSettingsModalOpen(false);
      fetchStoreAndProducts();
    } catch (error) {
      console.error('Error updating store:', error);
      alert('Failed to update store.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    setUploading(true);
    try {
      let imageUrl = productImageUrl;
      if (productImage) {
        imageUrl = await handleImageUpload(productImage, 'products');
      }

      const productData = {
        store_id: store.id,
        name: productName,
        price: parseFloat(productPrice),
        category: productCategory,
        size: productSize,
        tags: productTags,
        description: productDescription,
        image_url: imageUrl
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        if (error) throw error;
      }

      setIsProductModalOpen(false);
      resetProductForm();
      fetchStoreAndProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product.');
    } finally {
      setUploading(false);
    }
  };

  const resetProductForm = () => {
    setProductName('');
    setProductPrice('');
    setProductSize('M');
    setProductTags([]);
    setProductDescription('');
    setProductImage(null);
    setProductImageUrl('');
    setEditingProduct(null);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductPrice(product.price.toString());
    setProductCategory(product.category);
    setProductSize(product.size || 'M');
    setProductTags(product.tags || []);
    setProductDescription(product.description);
    setProductImageUrl(product.image);
    setProductImage(null);
    setIsProductModalOpen(true);
  };

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
      fetchStoreAndProducts();
    } catch (saveError) {
      console.error('Error updating seller order:', saveError);
      alert('Failed to update order.');
    } finally {
      setSavingOrderId(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface"><Loader2 className="animate-spin text-ink" size={48} /></div>;

  if (isCreatingStore) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl bg-white border-4 border-ink neo-shadow overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-5 sm:p-8 md:p-12 border-b-4 lg:border-b-0 lg:border-r-4 border-ink">
              <div className="mb-8">
                <p className="font-label font-bold text-xs uppercase tracking-[0.25em] text-ink/50 mb-3">Seller Onboarding</p>
                <h1 className="font-headline font-black text-4xl sm:text-5xl md:text-6xl tracking-tighter uppercase">Create Your Store</h1>
                <p className="font-body font-bold text-ink/60 mt-4 max-w-xl">
                  Set the basics for your storefront. Add a clean logo, a strong name, and a short description buyers can trust.
                </p>
              </div>

              <form onSubmit={handleCreateStore} className="space-y-6">
                <div className="space-y-2">
                  <label className="font-label font-bold text-xs uppercase tracking-widest">Store Name</label>
                  <input
                    type="text"
                    className="w-full border-4 border-ink p-4 font-bold bg-surface"
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    placeholder="Archive Supply"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-label font-bold text-xs uppercase tracking-widest">Description</label>
                  <textarea
                    rows={4}
                    className="w-full border-4 border-ink p-4 font-bold bg-surface resize-none"
                    value={storeDescription}
                    onChange={e => setStoreDescription(e.target.value)}
                    placeholder="Tell buyers what your store curates, the style you focus on, and what makes your archive special."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-label font-bold text-xs uppercase tracking-widest">Store Category</label>
                  <select
                    className="w-full border-4 border-ink p-4 font-bold bg-surface"
                    value={storeCategory}
                    onChange={e => setStoreCategory(e.target.value as 'clothing' | 'accessories')}
                  >
                    <option value="clothing">Clothing</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-primary-container border-4 border-ink py-5 font-headline font-black text-xl hover:opacity-90 transition-opacity"
                >
                  {uploading ? <Loader2 className="animate-spin mx-auto" /> : 'CREATE STORE'}
                </button>
              </form>
            </div>

            <div className="p-5 sm:p-8 md:p-12 bg-surface-container/50 flex flex-col justify-between gap-8">
              <div>
                <p className="font-label font-bold text-xs uppercase tracking-[0.25em] text-ink/50 mb-3">Logo</p>
                <h2 className="font-headline font-black text-3xl uppercase tracking-tight">Store Identity</h2>
                <p className="font-body font-bold text-ink/60 mt-3">
                  Upload a square logo or brand mark. A simple, high-contrast image works best here.
                </p>
              </div>

              <div
                onClick={() => storeImageInputRef.current?.click()}
                className="group cursor-pointer rounded-[24px] border-4 border-ink bg-white p-6 neo-shadow transition-all hover:-translate-y-1 hover:neo-shadow-lg"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-[20px] border-4 border-ink bg-surface overflow-hidden flex items-center justify-center flex-shrink-0">
                    {storeImageUrl ? (
                      <img src={storeImageUrl} alt="Store logo preview" className="w-full h-full object-cover" />
                    ) : (
                      <StoreIcon size={36} className="text-ink/30" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-headline font-black text-2xl uppercase leading-tight">
                      {storeImageUrl ? 'Logo Ready' : 'Upload Your Logo'}
                    </p>
                    <p className="font-body font-bold text-ink/55 mt-2">
                      {storeImageUrl ? 'Click to replace the current preview.' : 'PNG, JPG, or WEBP. Square images look the cleanest.'}
                    </p>
                    <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 border-2 border-ink bg-primary-container font-label font-bold text-xs uppercase tracking-widest">
                      <Upload size={14} />
                      {storeImageUrl ? 'Replace Image' : 'Choose Image'}
                    </div>
                  </div>
                </div>

                <input
                  type="file"
                  ref={storeImageInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setStoreImage(file);
                      setStoreImageUrl(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>

              <div className="border-4 border-ink bg-white p-5">
                <p className="font-label font-bold text-[11px] uppercase tracking-widest text-ink/50 mb-2">Preview</p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 border-4 border-ink bg-secondary-container overflow-hidden flex items-center justify-center">
                    {storeImageUrl ? (
                      <img src={storeImageUrl} alt="Store avatar preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-headline font-black text-xl uppercase text-ink">
                        {(storeName || 'S').slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-headline font-black text-xl uppercase truncate">
                      {storeName || 'Your Store Name'}
                    </p>
                    <p className="font-label font-bold text-[10px] uppercase tracking-widest text-ink/40 mb-1">
                      {storeCategory}
                    </p>
                    <p className="font-body font-bold text-sm text-ink/50 line-clamp-2">
                      {storeDescription || 'Your store description will appear here once you add it.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-ink text-white border-r-4 border-ink p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 ${store?.color || 'bg-primary-container'} text-ink font-black flex items-center justify-center border-2 border-white neo-shadow-sm`}>
            {store?.initials || 'S'}
          </div>
          <div>
            <h3 className="font-headline font-black text-sm uppercase">{store?.name}</h3>
            <span className="font-label text-[10px] text-white/40">SELLER DASHBOARD</span>
          </div>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-headline font-black text-sm border-2 transition-colors ${activeTab === 'inventory' ? 'bg-white text-ink border-white neo-shadow-sm' : 'text-white/60 hover:bg-white/10 border-transparent'}`}
          >
            <LayoutDashboard size={18} /> OVERVIEW
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-headline font-black text-sm transition-colors ${activeTab === 'inventory' ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-white/60'}`}
          >
            <Package size={18} /> INVENTORY
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-headline font-black text-sm transition-colors ${activeTab === 'orders' ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-white/60'}`}
          >
            <Truck size={18} /> ORDERS
          </button>
          <button onClick={() => setIsSettingsModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors font-headline font-black text-sm text-white/60">
            <Settings size={18} /> SETTINGS
          </button>
        </nav>

        <div className="mt-auto pt-8 border-t border-white/10">
          <button onClick={() => setPage('home')} className="w-full flex items-center gap-3 px-4 py-3 hover:text-primary-container transition-colors font-label font-bold text-xs text-white/40">
            <ArrowLeft size={14} /> BACK TO MARKET
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 sm:p-6 md:p-8 lg:p-12 bg-surface">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'inventory' ? (
            <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 sm:mb-12 gap-4 sm:gap-6">
                <div>
                  <h1 className="font-headline font-black text-4xl sm:text-5xl tracking-tighter uppercase">INVENTORY</h1>
                  <p className="font-body text-ink/50">Manage your archival pieces and active listings.</p>
                </div>
                <button onClick={() => { resetProductForm(); setIsProductModalOpen(true); }} className="w-full sm:w-auto bg-primary-container border-4 border-ink px-6 sm:px-8 py-4 font-headline font-black text-base sm:text-lg neo-shadow hover:neo-shadow-lg active-press transition-all flex items-center justify-center gap-3">
                  <Plus size={24} /> ADD NEW PRODUCT
                </button>
              </div>

              <div className="bg-white border-4 border-ink neo-shadow overflow-hidden">
                <div className="hidden sm:grid bg-surface-container border-b-4 border-ink p-4 grid-cols-4 font-label font-bold text-xs uppercase tracking-widest">
                  <div className="col-span-2">PRODUCT</div>
                  <div>PRICE</div>
                  <div>ACTIONS</div>
                </div>
                <div className="divide-y-2 divide-ink/10">
                  {products.length === 0 ? (
                    <div className="p-8 sm:p-12 text-center">
                      <Package size={48} className="mx-auto text-ink/10 mb-4" />
                      <p className="font-headline font-black text-xl uppercase text-ink/30">NO PRODUCTS YET</p>
                    </div>
                  ) : (
                    products.map(product => (
                      <div key={product.id} className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-4 gap-4 items-start sm:items-center hover:bg-surface-container/30 transition-colors">
                        <div className="sm:col-span-2 flex items-center gap-4 min-w-0">
                          <div className="w-14 h-14 sm:w-12 sm:h-12 bg-surface-container border-2 border-ink flex-shrink-0 overflow-hidden">
                            {product.image && <img src={product.image} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-label font-bold text-[10px] uppercase tracking-widest text-ink/40 sm:hidden">{product.category}</p>
                            <span className="block font-headline font-black text-base sm:text-lg uppercase truncate">{product.name}</span>
                          </div>
                        </div>
                        <div className="font-headline font-bold text-lg sm:text-base">Rs. {product.price}</div>
                        <div className="flex gap-2 sm:justify-start">
                          <button onClick={() => openEditProduct(product)} className="p-2 border-2 border-ink hover:bg-secondary-container transition-colors" title="Edit">
                            <Edit size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-8 sm:mb-12">
                <h1 className="font-headline font-black text-4xl sm:text-5xl tracking-tighter uppercase">ORDERS</h1>
                <p className="font-body text-ink/50">Monitor buyer details, order status, and shipment tracking for your store.</p>
              </div>

              {orders.length === 0 ? (
                <div className="bg-white border-4 border-ink p-8 sm:p-12 neo-shadow text-center">
                  <Truck size={48} className="mx-auto text-ink/15 mb-4" />
                  <p className="font-headline font-black text-xl sm:text-2xl uppercase text-ink/30">NO ORDERS YET</p>
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
                                {order.status}
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
            </>
          )}
        </div>
      </main>

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[100] bg-ink/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border-4 border-ink w-full max-w-3xl max-h-[90vh] overflow-y-auto neo-shadow-lg">
            <div className="sticky top-0 bg-surface border-b-4 border-ink p-4 sm:p-6 flex justify-between items-center gap-4 z-10">
              <h2 className="font-headline font-black text-2xl sm:text-3xl uppercase">{editingProduct ? 'EDIT PRODUCT' : 'ADD NEW PRODUCT'}</h2>
              <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-tertiary hover:text-white transition-colors border-2 border-ink"><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-4 sm:p-8 space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="font-label font-bold text-xs uppercase">PRODUCT NAME</label>
                    <input type="text" className="w-full border-4 border-ink p-4 font-bold" value={productName} onChange={e => setProductName(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="font-label font-bold text-xs uppercase tracking-widest">PRICE ($)</label>
                      <input type="number" className="w-full border-4 border-ink p-4 font-bold" value={productPrice} onChange={e => setProductPrice(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <label className="font-label font-bold text-xs uppercase tracking-widest">CATEGORY</label>
                      <select 
                        className="w-full bg-white border-4 border-ink p-4 font-body font-bold outline-none appearance-none"
                        value={productCategory}
                        onChange={(e) => setProductCategory(e.target.value)}
                      >
                        <option>CLOTHING</option>
                        <option>FOOTWEAR</option>
                        <option>ACCESSORIES</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="font-label font-bold text-xs uppercase tracking-widest">SIZE</label>
                      <select 
                        className="w-full bg-white border-4 border-ink p-4 font-body font-bold outline-none appearance-none"
                        value={productSize}
                        onChange={(e) => setProductSize(e.target.value)}
                      >
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
                            if (productTags.includes(tag)) {
                              setProductTags(productTags.filter(t => t !== tag));
                            } else {
                              setProductTags([...productTags, tag]);
                            }
                          }}
                          className={`px-3 py-1 border-2 border-ink font-label font-bold text-[10px] transition-colors ${productTags.includes(tag) ? 'bg-primary-container' : 'bg-white'}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="font-label font-bold text-xs uppercase">DESCRIPTION</label>
                    <textarea rows={4} className="w-full border-4 border-ink p-4 font-bold" value={productDescription} onChange={e => setProductDescription(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-6">
                  <label className="font-label font-bold text-xs uppercase">IMAGE</label>
                  <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-ink/20 aspect-square flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-white">
                    {productImageUrl ? <img src={productImageUrl} className="w-full h-full object-cover" /> : <Upload className="text-ink/20" size={48} />}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
                      const file = e.target.files?.[0];
                      if(file) { setProductImage(file); setProductImageUrl(URL.createObjectURL(file)); }
                    }} />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={uploading} className="w-full bg-primary-container border-4 border-ink py-5 font-headline font-black text-xl hover:opacity-90">
                {uploading ? <Loader2 className="animate-spin mx-auto" /> : 'SAVE LISTING'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-[100] bg-ink/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border-4 border-ink w-full max-w-lg neo-shadow-lg">
            <div className="sticky top-0 bg-surface border-b-4 border-ink p-4 sm:p-6 flex justify-between items-center gap-4">
              <h2 className="font-headline font-black text-2xl uppercase">STORE SETTINGS</h2>
              <button onClick={() => setIsSettingsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleUpdateStore} className="p-4 sm:p-8 space-y-6">
              <div className="space-y-2">
                <label className="font-label font-bold text-xs uppercase">STORE NAME</label>
                <input type="text" className="w-full border-4 border-ink p-3 font-bold" value={storeName} onChange={e => setStoreName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="font-label font-bold text-xs uppercase">DESCRIPTION</label>
                <textarea rows={3} className="w-full border-4 border-ink p-3 font-bold" value={storeDescription} onChange={e => setStoreDescription(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="font-label font-bold text-xs uppercase">STORE CATEGORY</label>
                <select
                  className="w-full border-4 border-ink p-3 font-bold bg-white"
                  value={storeCategory}
                  onChange={e => setStoreCategory(e.target.value as 'clothing' | 'accessories')}
                >
                  <option value="clothing">Clothing</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="font-label font-bold text-xs uppercase tracking-widest">UPDATE LOGO</label>
                <div 
                  onClick={() => storeImageInputRef.current?.click()}
                  className="border-4 border-dashed border-ink/20 aspect-video flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-surface-container transition-colors relative overflow-hidden bg-white"
                >
                  {storeImageUrl ? (
                    <img src={storeImageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload size={32} className="text-ink/20 mb-2" />
                      <p className="font-headline font-black text-sm uppercase text-ink/30">CLICK TO UPLOAD</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={storeImageInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setStoreImage(file);
                        setStoreImageUrl(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>
              </div>
              <button type="submit" disabled={uploading} className="w-full bg-secondary-container border-4 border-ink py-4 font-headline font-black text-xl hover:opacity-90">
                {uploading ? <Loader2 className="animate-spin mx-auto" /> : 'UPDATE STORE'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
