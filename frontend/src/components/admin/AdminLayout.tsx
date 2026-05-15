import { Outlet } from 'react-router-dom';

export function AdminLayout() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <Outlet />
    </div>
  );
}
