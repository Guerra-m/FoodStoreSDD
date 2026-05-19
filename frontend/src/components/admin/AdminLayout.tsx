import { Outlet } from 'react-router-dom';

export function AdminLayout() {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-neutral-200/60 p-6 animate-in">
      <Outlet />
    </div>
  );
}