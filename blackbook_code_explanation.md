# Blackbook: VIKTHRIFTS Code Explanations

This document identifies and explains the most critical code sections of the VIKTHRIFTS web application.

---

## 1. Custom Routing and Global State Management
**File:** `src/App.tsx`

```typescript
const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [user, setUser] = useState<any>(null);
  const [isSeller, setIsSeller] = useState(false);

  // ... handleSession logic ...

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home setPage={setCurrentPage} onProductClick={navigateToProduct} onAddToCart={addToCart} onSearch={handleSearch} />;
      case 'search':
        return <SearchResults query={searchQuery} onProductClick={navigateToProduct} onAddToCart={addToCart} />;
      case 'stores':
        return <Stores setPage={setCurrentPage} onStoreClick={navigateToStore} />;
      // ... other cases ...
      default:
        return <Home setPage={setCurrentPage} onProductClick={navigateToProduct} onAddToCart={addToCart} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar setPage={setCurrentPage} cartCount={cart.length} user={user} isSeller={isSeller} onSearch={handleSearch} isHome={currentPage === 'home'} />
      <main className={`flex-grow ${currentPage !== 'home' ? 'pt-[88px]' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div key={currentPage} ...>
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer setPage={setCurrentPage} />
    </div>
  );
};
```

### Explanation
VIKTHRIFTS does not use a traditional routing library like `react-router-dom`. Instead, it uses a **state-based routing** mechanism. The `currentPage` state determines which component to render via the `renderPage` function. Global states like the shopping cart, user session, and roles (Buyer vs. Seller) are also managed at this top level and passed down as props.

---

## 2. Supabase Backend Integration
**File:** `src/supabase.ts`

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://becqbmoeliuzlipspsvz.supabase.co';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseAnonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY is missing.');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
};

export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const client = getSupabase();
    return (client as any)[prop];
  }
});
```

### Explanation
This file initializes the **Supabase client**, which is used for authentication and database operations. It uses a **Singleton pattern** with a `Proxy` wrapper to ensure the client is only created once and to provide helpful error messages if the environment variables (API keys) are missing.

---

## 3. Core Data Structures (Types)
**File:** `src/types.ts`

```typescript
export type Page = 'home' | 'stores' | 'product' | 'cart' | 'auth-buyer' | 'auth-seller' | ...;

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  store: string;
  description: string;
  tags: string[];
  size?: 'S' | 'M' | 'L' | 'XL' | '2XL';
}

export interface Store {
  id: string;
  name: string;
  initials: string;
  color: string;
  tags: string[];
  description: string;
  image: string;
}
```

### Explanation
TypeScript interfaces define the shape of the data used throughout the application. `Product` and `Store` are the primary entities, while the `Page` type ensures type safety for the custom routing system.

---

## 4. Data Fetching Logic
**File:** `src/pages/Home.tsx` (Example)

```typescript
useEffect(() => {
  const fetchData = async () => {
    try {
      // Fetch Stores
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .limit(4);
      
      // Fetch Products with Store Information (Join)
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*, stores(name)')
        .limit(8);

      if (storesError) throw storesError;
      if (productsError) throw productsError;

      // Transform and Set State
      setProducts(productsData.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image_url,
        store: p.stores?.name || 'Unknown Store',
        // ...
      })));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  fetchData();
}, []);
```

### Explanation
The application interacts with Supabase using its JavaScript client. This example shows how data is fetched from the `stores` and `products` tables. It includes a **relational join** (`stores(name)`) to retrieve the store name associated with each product directly in one query.

---

## 5. Seller Management (Dashboard)
**File:** `src/pages/SellerDashboard.tsx`

```typescript
const fetchStoreAndProducts = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: storeData } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (storeData) {
    setStore(formatStore(storeData));
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeData.id);
    setProducts(formatProducts(productsData));
  }
};
```

### Explanation
The `SellerDashboard` represents the **CRUD (Create, Read, Update, Delete)** operations for store owners. It first verifies the authenticated user, retrieves their specific store using `owner_id`, and then fetches all products associated with that store. This ensures data privacy and role-based access.
