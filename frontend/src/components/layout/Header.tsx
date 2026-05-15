import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <h1 className="text-xl font-bold text-gray-800">FoodStore</h1>
      {user && (
        <span className="text-sm text-gray-500">
          {user.nombre || user.email}
        </span>
      )}
    </header>
  );
}
