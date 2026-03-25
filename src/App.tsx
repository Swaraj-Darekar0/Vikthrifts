import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Page, Product } from './types';
import { Home } from './pages/Home';
import { Stores } from './pages/Stores';
import { Auth } from './pages/Auth';
import { AuthChoice } from './pages/AuthChoice';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { SellerDashboard } from './pages/SellerDashboard';
import { StoreDetail } from './pages/StoreDetail';
import { HelpCenter } from './pages/HelpCenter';
import { ShippingInfo } from './pages/ShippingInfo';
import { Returns } from './pages/Returns';
import { ContactUs } from './pages/ContactUs';
import { Profile } from './pages/Profile';
import { SearchResults } from './pages/SearchResults';
import { AdminAuth } from './pages/AdminAuth';
import { AdminDashboard } from './pages/AdminDashboard';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { supabase } from './supabase';

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timeoutHandle: number | null = null;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = window.setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle !== null) window.clearTimeout(timeoutHandle);
  }
};

const App: React.FC = () => {
  const persistablePages: Page[] = [
    'home',
    'stores',
    'cart',
    'checkout',
    'auth-choice',
    'auth-buyer',
    'auth-seller',
    'seller-dashboard',
    'help-center',
    'shipping',
    'returns',
    'contact',
    'profile',
    'admin-auth',
    'admin-dashboard',
    'search',
  ];

  const [currentPage, setCurrentPage] = useState<Page>(() => {
    try {
      const saved = sessionStorage.getItem('thredz:page') as Page | null;
      if (saved && persistablePages.includes(saved)) return saved;
    } catch {
      // ignore (storage may be blocked)
    }
    return 'home';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedStore, setSelectedStore] = useState<any>(null); // Store | null
  const [isSeller, setIsSeller] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const currentPageRef = useRef<Page>(currentPage);
  const isGuestLocked = !authLoading && !user;
  const isGuestAuthFlow = isGuestLocked && ['home', 'auth-choice', 'auth-buyer', 'auth-seller'].includes(currentPage);

  const clearProductParam = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('product');
    window.history.replaceState(window.history.state, '', url.toString());
  };

  const loadProductFromUrl = async (productId: string) => {
    // Try official drops first
    const { data: adminData, error: adminError } = await supabase
      .from('admin_products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();

    if (adminError && adminError.code !== 'PGRST116') throw adminError;

    if (adminData) {
      return {
        id: adminData.id,
        name: adminData.name,
        price: adminData.price,
        image: adminData.image_url,
        category: adminData.category,
        size: adminData.size,
        store: 'VIKTHRIFTS OFFICIAL',
        description: adminData.description,
        tags: adminData.tags || [],
      };
    }

    // Then seller products
    const { data: sellerData, error: sellerError } = await supabase
      .from('products')
      .select('*, stores(name)')
      .eq('id', productId)
      .maybeSingle();

    if (sellerError && sellerError.code !== 'PGRST116') throw sellerError;

    if (!sellerData) return null;

    return {
      id: sellerData.id,
      name: sellerData.name,
      price: sellerData.price,
      image: sellerData.image_url,
      category: sellerData.category,
      size: sellerData.size,
      store: sellerData.stores?.name || 'Unknown Store',
      description: sellerData.description,
      tags: sellerData.tags || [],
    };
  };

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    try {
      // Only persist pages that can safely restore without in-memory state (avoids broken "product/store-detail" restores).
      const next = persistablePages.includes(currentPage) ? currentPage : 'home';
      sessionStorage.setItem('thredz:page', next);
    } catch {
      // ignore
    }
  }, [currentPage]);

  useEffect(() => {
    const authPages: Page[] = ['auth-choice', 'auth-buyer', 'auth-seller', 'admin-auth'];

    const resolveRole = async (user: any) => {
      let role = user?.user_metadata?.role;
      if (role) return role;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      return profile?.role;
    };

    const isAdminByEmail = async (email: string | null | undefined) => {
      if (!email) return false;
      const { data, error } = await supabase
        .from('admin_settings')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return Boolean(data?.id);
    };

    // Helper to determine role and update state
    const handleSession = async (session: any, event: string | null = null) => {
      if (!session?.user) {
        setUser(null);
        setIsSeller(false);
        setIsAdmin(false);

        const allowedPublicPages: Page[] = ['home', 'auth-buyer', 'auth-seller', 'admin-auth'];

        if (!allowedPublicPages.includes(currentPageRef.current)) {
          setCurrentPage('home');
        }

        return;
      }

      setUser(session.user);
      
      // Check role from metadata first (faster), then DB
      let role: any = session.user.user_metadata?.role;
      if (!role) {
        try {
          role = await withTimeout(resolveRole(session.user), 5000, 'resolveRole');
        } catch (e) {
          console.warn('[App] Role resolution failed or timed out:', e);
          role = undefined;
        }
      }

      const isAdminRole = role === 'admin';
      setIsAdmin(isAdminRole);

      const isSellerRole = role === 'seller';
      setIsSeller(isSellerRole);

      // Handle Redirects
      // SIGNED_IN: Occurs on login or email link click
      const isOnAuthPage = authPages.includes(currentPageRef.current);

      if (event === 'SIGNED_IN' || isOnAuthPage) {
        console.log('[App] Auth Event: SIGNED_IN -> Redirecting based on role:', role);
        if (currentPageRef.current === 'admin-auth') {
          try {
            const allowed = await withTimeout(isAdminByEmail(session.user.email), 5000, 'adminEmailCheck');
            if (allowed) {
              setIsAdmin(true);
              setCurrentPage('admin-dashboard');
            } else {
              setIsAdmin(false);
              setCurrentPage('home');
            }
          } catch (e) {
            console.warn('[App] Admin email check failed/timed out:', e);
            setIsAdmin(false);
            setCurrentPage('home');
          }
          return;
        }

        if (isAdminRole) {
          setCurrentPage('admin-dashboard');
        } else if (isSellerRole) {
          setCurrentPage('seller-dashboard');
        } else {
          setCurrentPage('home');
        }
      }
    };

    // 1. Check Initial Session
    const initSession = async () => {
      try {
        const { data } = await withTimeout(supabase.auth.getSession(), 5000, 'getSession');
        setAuthLoading(false);
        void handleSession(data.session, 'INITIAL_SESSION');
      } catch (e: any) {
        console.warn('[App] Initial session check failed/timed out:', e);
        if (e.message?.includes('VITE_SUPABASE_ANON_KEY')) {
          setConfigError(e.message);
        }
      } finally {
        setAuthLoading(false);
      }
    };
    initSession();

    // 2. Listen for Auth Changes
    let subscription: any;
    try {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(`[App] Auth State Change: ${event}`);
        setAuthLoading(false);
        void handleSession(session, event);
      });
      subscription = data.subscription;
    } catch (e: any) {
      if (e.message?.includes('VITE_SUPABASE_ANON_KEY')) {
        setConfigError(e.message);
      }
      setAuthLoading(false);
    }

    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (authLoading || user) return;

    const protectedPages: Page[] = [
      'stores',
      'product',
      'cart',
      'checkout',
      'seller-dashboard',
      'store-detail',
      'help-center',
      'shipping',
      'returns',
      'contact',
      'profile',
      'admin-dashboard',
      'search',
    ];

    if (protectedPages.includes(currentPage)) {
      setCurrentPage('home');
    }
  }, [authLoading, currentPage, user]);

  useEffect(() => {
    // Keep URL in sync when viewing a product
    const url = new URL(window.location.href);
    const urlProduct = url.searchParams.get('product');

    if (currentPage === 'product' && selectedProduct?.id) {
      if (urlProduct !== selectedProduct.id) {
        url.searchParams.set('product', selectedProduct.id);
        window.history.replaceState({ page: 'product', productId: selectedProduct.id }, '', url.toString());
      }
      return;
    }

    if (urlProduct) {
      url.searchParams.delete('product');
      window.history.replaceState(window.history.state, '', url.toString());
    }
  }, [currentPage, selectedProduct?.id]);

  useEffect(() => {
    // Support opening shared links like `?product=<uuid>`
    if (!user) return;

    const syncFromUrl = async () => {
      const url = new URL(window.location.href);
      const productId = url.searchParams.get('product');
      if (!productId) return;

      try {
        const loaded = await loadProductFromUrl(productId);
        if (!loaded) {
          clearProductParam();
          setCurrentPage('home');
          return;
        }

        setSelectedProduct(loaded);
        setCurrentPage('product');
      } catch (e) {
        console.error('[App] Failed to load product from URL:', e);
        clearProductParam();
        setCurrentPage('home');
      }
    };

    syncFromUrl();

    const onPopState = () => {
      // Re-run to handle browser back/forward affecting query params.
      syncFromUrl();
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [user]);

  const addToCart = (product: Product) => {
    setCart(prev => [...prev, product]);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const navigateToProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage('product');
    window.scrollTo(0, 0);
  };

  const navigateToStore = (store: any) => {
    setSelectedStore(store);
    setCurrentPage('store-detail');
    window.scrollTo(0, 0);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage('search');
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home setPage={setCurrentPage} onProductClick={navigateToProduct} onAddToCart={addToCart} onSearch={handleSearch} />;
      case 'search':
        return <SearchResults query={searchQuery} onProductClick={navigateToProduct} onAddToCart={addToCart} />;
      case 'stores':
        return <Stores setPage={setCurrentPage} onStoreClick={navigateToStore} />;
      case 'store-detail':
        return selectedStore ? (
          <StoreDetail 
            store={selectedStore} 
            setPage={setCurrentPage} 
            onProductClick={navigateToProduct}
            onAddToCart={addToCart}
          />
        ) : null;
      case 'help-center':
        return <HelpCenter setPage={setCurrentPage} />;
      case 'shipping':
        return <ShippingInfo setPage={setCurrentPage} />;
      case 'returns':
        return <Returns setPage={setCurrentPage} />;
      case 'contact':
        return <ContactUs setPage={setCurrentPage} />;
      case 'profile':
        return <Profile setPage={setCurrentPage} />;
      case 'admin-auth':
        return <AdminAuth setPage={setCurrentPage} setIsAdmin={setIsAdmin} />;
      case 'admin-dashboard':
        return isAdmin ? <AdminDashboard setPage={setCurrentPage} setIsAdmin={setIsAdmin} /> : <AdminAuth setPage={setCurrentPage} setIsAdmin={setIsAdmin} />;
      case 'auth-buyer':
        return <Auth type="buyer" setPage={setCurrentPage} setIsSeller={setIsSeller} />;
      case 'auth-seller':
        return <Auth type="seller" setPage={setCurrentPage} setIsSeller={setIsSeller} />;
      case 'auth-choice':
        return <Home setPage={setCurrentPage} onProductClick={navigateToProduct} onAddToCart={addToCart} onSearch={handleSearch} />;
      case 'product':
        return selectedProduct ? (
          <ProductDetail 
            product={selectedProduct} 
            onAddToCart={addToCart} 
            onProductClick={navigateToProduct}
          />
        ) : null;
      case 'cart':
        return <Cart items={cart} onRemove={removeFromCart} setPage={setCurrentPage} />;
      case 'checkout':
        return <Checkout items={cart} setPage={setCurrentPage} onOrderPlaced={clearCart} />;
      case 'seller-dashboard':
        return <SellerDashboard setPage={setCurrentPage} />;
      default:
        return <Home setPage={setCurrentPage} onProductClick={navigateToProduct} onAddToCart={addToCart} />;
    }
  };

  const renderGuestOverlay = () => {
    switch (currentPage) {
      case 'auth-buyer':
        return <Auth type="buyer" setPage={setCurrentPage} setIsSeller={setIsSeller} overlay />;
      case 'auth-seller':
        return <Auth type="seller" setPage={setCurrentPage} setIsSeller={setIsSeller} overlay />;
      default:
        return <AuthChoice setPage={setCurrentPage} overlay />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="animate-spin text-ink" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {configError && (
        <div className="bg-tertiary text-white px-4 py-2 text-center font-label font-bold text-xs border-b-4 border-ink">
          ⚠️ {configError}
        </div>
      )}
      <Navbar setPage={setCurrentPage} cartCount={cart.length} user={user} isSeller={isSeller} onSearch={handleSearch} isHome={currentPage === 'home'} />

      <main className={`flex-grow relative ${currentPage !== 'home' ? 'pt-[88px]' : ''}`}>
        {isGuestAuthFlow ? (
          <>
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
              <div className="absolute inset-0 blur-[16px] saturate-75 scale-[1.03] origin-center">
                <Home setPage={setCurrentPage} onProductClick={navigateToProduct} onAddToCart={addToCart} onSearch={handleSearch} />
              </div>
              <div className="absolute inset-0 bg-ink/30" />
            </div>

            <div className="relative z-30 min-h-[calc(100vh-88px)] flex items-start justify-center px-4 pt-24 sm:pt-28 md:pt-32 pb-8">
              {renderGuestOverlay()}
            </div>
          </>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {isGuestLocked ? (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setCurrentPage('admin-auth')}
            className="bg-ink/85 text-white border-2 border-white/20 px-4 py-2 font-label font-bold text-[10px] uppercase tracking-[0.25em] hover:bg-ink transition-colors"
          >
            Admin
          </button>
        </div>
      ) : (
        <Footer setPage={setCurrentPage} />
      )}
    </div>
  );
};

export default App;
