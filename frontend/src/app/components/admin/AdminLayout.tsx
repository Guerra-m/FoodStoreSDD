import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AdminLayout() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '1.5rem', background: '#fff', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
}
