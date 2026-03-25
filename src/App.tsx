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

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
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

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    const authPages: Page[] = ['auth-choice', 'auth-buyer', 'auth-seller', 'admin-auth'];

    // Helper to determine role and update state
    const handleSession = async (session: any, event: string | null = null) => {
      if (!session?.user) {
        setUser(null);
        setIsSeller(false);
        setIsAdmin(false);

        if (!authPages.includes(currentPageRef.current)) {
          setCurrentPage('auth-choice');
        }

        return;
      }

      setUser(session.user);
      
      // Check role from metadata first (faster), then DB
      let role = session.user.user_metadata?.role;
      
      if (!role) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();
        role = profile?.role;
      }

      const isSellerRole = role === 'seller';
      setIsSeller(isSellerRole);

      // Handle Redirects
      // SIGNED_IN: Occurs on login or email link click
      const isOnAuthPage = authPages.includes(currentPageRef.current);

      if (event === 'SIGNED_IN' || isOnAuthPage) {
        console.log('[App] Auth Event: SIGNED_IN -> Redirecting based on role:', role);
        if (isSellerRole) {
          setCurrentPage('seller-dashboard');
        } else {
          setCurrentPage('home');
        }
      }
    };

    // 1. Check Initial Session
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await handleSession(session, 'INITIAL_SESSION');
      } catch (e: any) {
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
        await handleSession(session, event);
        setAuthLoading(false);
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
      'home',
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
      setCurrentPage('auth-choice');
    }
  }, [authLoading, currentPage, user]);

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
        return <AuthChoice setPage={setCurrentPage} />;
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

      <main className={`flex-grow ${currentPage !== 'home' ? 'pt-[88px]' : ''}`}>
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
      </main>

      <Footer setPage={setCurrentPage} />
    </div>
  );
};

export default App;
