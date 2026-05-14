import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/users', label: 'Usuarios', end: false },
  { to: '/admin/orders', label: 'Pedidos', end: false },
];

export function Sidebar() {
  return (
    <aside
      style={{
        width: '220px',
        minHeight: '100vh',
        borderRight: '1px solid #e5e7eb',
        padding: '1rem 0',
        background: '#f9fafb',
      }}
    >
      <div style={{ padding: '0 1rem 1rem', fontWeight: 700, fontSize: '1.1rem', color: '#111827' }}>
        ⚙️ Admin Panel
      </div>
      <nav>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              display: 'block',
              padding: '0.6rem 1rem',
              textDecoration: 'none',
              color: isActive ? '#2563eb' : '#374151',
              background: isActive ? '#eff6ff' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent',
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
