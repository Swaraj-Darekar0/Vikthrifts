# VIKTHRIFTS Project Context

## Project Overview
VIKTHRIFTS is a React-based Single Page Application (SPA) built with Vite and TypeScript. It appears to be an e-commerce platform with features for both buyers and sellers (stores, products, cart, authentication).

**Key Characteristics:**
- **Framework:** React 19 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Framer Motion (animations)
- **Icons:** Lucide React
- **Backend:** Supabase (Auth & Database)
- **Routing:** Custom state-based routing (managed in `App.tsx`), NOT `react-router-dom`.

## Architecture & Conventions

### 1. Routing
The application uses a custom routing mechanism controlled by the `currentPage` state in `src/App.tsx`.
- **Navigation:** To navigate, components accept a `setPage` prop (or similar callback) to update the state in `App.tsx`.
- **Page Components:** Located in `src/pages/`. They typically receive `setPage` to handle internal navigation links.

### 2. State Management
- **Global/Session State:** Managed in `App.tsx` (User session, Cart, Current Page).
- **Local State:** `useState` within individual components.
- **Backend State:** Fetched directly via `supabase` client.

### 3. Backend (Supabase)
- **Client:** Initialized in `src/supabase.ts`.
- **Auth:** Handles user sessions and role-based access (Buyer vs. Seller).
- **Data:** Direct database queries using the Supabase JS client.
- **Environment Variables:** Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### 4. Legacy / Alternative Config
- **Firebase:** References exist (`src/firebase.ts`, `firebase-applet-config.json`), but the active application logic in `App.tsx` exclusively uses Supabase. Treat Firebase as inactive unless specifically instructed otherwise.

## Development Workflow

### Prerequisites
- Node.js
- Supabase project credentials

### Setup
1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Environment Configuration:**
    Create a `.env` or `.env.local` file with:
    ```env
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    ```
    *Note: The project may also reference `GEMINI_API_KEY` for AI features.*

### Scripts
- **Development Server:**
    ```bash
    npm run dev
    ```
    Runs on `http://localhost:3000` (or configured port).
- **Build:**
    ```bash
    npm run build
    ```
- **Lint:**
    ```bash
    npm run lint
    ```

## Directory Structure
- `src/`
    - `App.tsx`: Main entry point, handles routing and global state.
    - `components/`: Reusable UI components (Navbar, Footer, ProductCard).
    - `pages/`: Full-page views (Home, Auth, Cart, SellerDashboard).
    - `supabase.ts`: Supabase client configuration.
    - `types.ts`: TypeScript definitions for application entities (Product, Page, etc.).
