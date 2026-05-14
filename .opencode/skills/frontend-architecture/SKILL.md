---
name: frontend-architecture
description: >
  Clean, scalable, modular frontend architecture for React + TypeScript + Vite projects.
  Enforces separation of concerns: business logic in hooks, UI in components.
  Trigger: When creating new frontend code, refactoring components, or structuring features.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Creating new pages, components, hooks, or API clients
- Refactoring existing components that mix logic with UI
- Reviewing pull requests for frontend architecture compliance
- Onboarding new developers to the project structure

## Mandatory Architecture Rules

### 1. Separation of Concerns

- **NO business logic inside visual components.** Components only render UI and delegate to hooks.
- **NO direct `fetch`/`axios` calls inside components.** All HTTP logic lives in `src/api/`.
- **NO state management logic inside components.** All `useState`, `useReducer`, `useContext` live in custom hooks under `src/hooks/` or `src/api/`.
- Components receive data and callbacks via props. They do NOT fetch or mutate data directly.

### 2. Strict Typing

- Every function, hook, and component MUST have explicit TypeScript types.
- **`any` is PROHIBITED.** Use `unknown` if the type is truly uncertain, then narrow it.
- API responses MUST have defined interfaces in `src/types/`.
- Never use `as` casting unless you've validated the shape first.

### 3. Folder Responsibilities

| Directory | Purpose | Rules |
|-----------|---------|-------|
| `src/api/` | HTTP client modules per resource | One file per resource (e.g., `pedidos.ts`, `auth.ts`). Export custom hooks, not bare functions. |
| `src/assets/` | Static files (images, SVGs, fonts) | No code here, only static assets. |
| `src/components/` | Reusable presentational components | Pure UI. No data fetching. Receive props. Use atomic design (atoms/molecules). |
| `src/hooks/` | Shared custom hooks | Business logic, state management, side effects. One concern per hook. |
| `src/lib/` | Utility/helper functions | Pure functions only. No React, no side effects. |
| `src/pages/` | Page-level components | One file per route. Compose components + hooks. Keep thin — delegate to hooks. |
| `src/router/` | Route definitions | React Router config. No business logic. |
| `src/types/` | TypeScript interfaces and types | Shared types used across the app. API contracts, domain models. |

### 4. Clean Code Principles

- **Single Responsibility**: Each file does ONE thing. If a hook manages authentication AND formats dates, split it.
- **DRY**: Extract repeated logic into shared hooks or lib utils.
- **Small files**: If a file exceeds 200 lines, it's a candidate for splitting.
- **Explicit over implicit**: Named exports only (no `export default`). Functions over magic strings.
- **Colocation**: Place files close to where they're used. A hook only used by one page lives next to that page — but under `src/hooks/` if shared.

## Code Examples

### ❌ INCORRECT — logic inside component

```typescript
// pages/OrderListPage.tsx — MAL
export const OrderListPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/pedidos').then((res) => {
      setOrders(res.data);
      setLoading(false);
    });
  }, []);
  // ... render
};
```

### ✅ CORRECT — logic extracted to hook

```typescript
// api/pedidos.ts
export function usePedidos() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/pedidos').then((res) => {
      setOrders(res.data);
      setLoading(false);
    });
  }, []);

  return { orders, loading };
}

// pages/OrderListPage.tsx
import { usePedidos } from '@/api/pedidos';

export const OrderListPage = () => {
  const { orders, loading } = usePedidos();
  // ... only render logic
};
```

### ✅ API hook pattern

```typescript
// api/auth.ts
import { AuthUser, LoginCredentials } from '@/types/auth';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = async (creds: LoginCredentials): Promise<void> => {
    const { data } = await axios.post<AuthUser>('/api/auth/login', creds);
    setUser(data);
  };

  const logout = async (): Promise<void> => {
    await axios.post('/api/auth/logout');
    setUser(null);
  };

  return { user, login, logout, isAuthenticated: user !== null };
}
```

### ✅ Component receives data via props

```typescript
// components/OrderCard.tsx
interface OrderCardProps {
  order: Order;
  onCancel: (id: number) => void;
}

export const OrderCard = ({ order, onCancel }: OrderCardProps) => (
  <div className="rounded-lg border p-4">
    <h3>{order.id}</h3>
    <button onClick={() => onCancel(order.id)}>Cancelar</button>
  </div>
);
```

## Commands

```bash
# Create a new page with its hook in one go
# 1. Create the hook
# 2. Create the page component
# 3. Register the route
```

## Resources

- **React Docs**: [https://react.dev/](https://react.dev/)
- **Vite Guide**: [https://vitejs.dev/guide/](https://vitejs.dev/guide/)
