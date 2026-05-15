import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/users', label: 'Usuarios', end: false },
  { to: '/admin/orders', label: 'Pedidos', end: false },
];

export function Sidebar() {
  return (
    <aside className="w-[220px] min-h-screen border-r border-gray-200 py-0 bg-gray-50">
      <div className="px-4 pb-4 pt-4 font-bold text-lg text-gray-900">
        ⚙️ Admin Panel
      </div>
      <nav>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `block px-4 py-2.5 no-underline transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-semibold border-l-[3px] border-blue-600'
                  : 'text-gray-600 border-l-[3px] border-transparent hover:bg-gray-100'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
