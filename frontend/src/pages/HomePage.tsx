import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Bienvenido a FoodStore
        </h2>
        <p className="text-gray-600">
          Tu tienda de comida online. Explorá nuestro catálogo y hacé tu pedido.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/catalog"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold text-gray-800 mb-1">🛍️ Catálogo</h3>
          <p className="text-sm text-gray-500">Explorá todos nuestros productos</p>
        </Link>

        <Link
          to="/perfil"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold text-gray-800 mb-1">👤 Mi Perfil</h3>
          <p className="text-sm text-gray-500">Administrá tus datos personales</p>
        </Link>

        <Link
          to="/mis-pedidos"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold text-gray-800 mb-1">📦 Mis Pedidos</h3>
          <p className="text-sm text-gray-500">Seguí el estado de tus pedidos</p>
        </Link>
      </div>
    </div>
  );
}
