import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders, useOrderById } from '../../shared/hooks/useOrders';
import { formatPrice, formatDate, getEstadoLabel, getEstadoColor } from '../../shared/api/orderApi';

export default function MisPedidos() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useOrders(page, 10);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  
  const { data: orderDetail, isLoading: detailLoading } = useOrderById(selectedOrderId);

  if (isLoading) return <div style={{ padding: '20px' }}>Cargando pedidos...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error al cargar pedidos</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Mis Pedidos</h1>
      
      {data?.pedidos && data.pedidos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#666', marginBottom: '20px' }}>No tenés pedidos aún.</p>
          <Link 
            to="/catalog" 
            style={{ 
              padding: '10px 20px', 
              background: '#007bff', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '4px' 
            }}
          >
            Ir al Catálogo
          </Link>
        </div>
      ) : (
        <>
          {/* Lista de pedidos */}
          <div style={{ marginBottom: '30px' }}>
            {data?.pedidos.map((pedido) => (
              <div
                key={pedido.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '15px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    Pedido #{pedido.id}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>
                    {formatDate(pedido.creado_en)}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>
                    Entrega: {pedido.direccion_snapshot.calle} {pedido.direccion_snapshot.numero}, {pedido.direccion_snapshot.ciudad}
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: getEstadoColor(pedido.estado),
                    }}
                  >
                    {getEstadoLabel(pedido.estado)}
                  </span>
                  
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {formatPrice(pedido.total)}
                  </span>
                  
                  <button
                    onClick={() => setSelectedOrderId(pedido.id)}
                    style={{
                      padding: '8px 16px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Ver Detalle
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{ padding: '8px 16px' }}
            >
              Anterior
            </button>
            <span style={{ padding: '8px 16px' }}>
              Página {page} ({(data?.total || 0)} pedidos)
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data || page * 10 >= data.total}
              style={{ padding: '8px 16px' }}
            >
              Siguiente
            </button>
          </div>
        </>
      )}

      {/* Modal de detalle del pedido */}
      {selectedOrderId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedOrderId(null)}
        >
          <div
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading ? (
              <div>Cargando detalle...</div>
            ) : orderDetail ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0 }}>Pedido #{orderDetail.id}</h2>
                  <button
                    onClick={() => setSelectedOrderId(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <strong>Estado:</strong>{' '}
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: getEstadoColor(orderDetail.estado),
                    }}
                  >
                    {getEstadoLabel(orderDetail.estado)}
                  </span>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <strong>Fecha:</strong> {formatDate(orderDetail.creado_en)}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <strong>Dirección de entrega:</strong>
                  <div style={{ color: '#666' }}>
                    {orderDetail.direccion_snapshot.calle} {orderDetail.direccion_snapshot.numero}
                    {orderDetail.direccion_snapshot.piso && `, Piso ${orderDetail.direccion_snapshot.piso}`}
                    {orderDetail.direccion_snapshot.departamento && `, Depto ${orderDetail.direccion_snapshot.departamento}`}
                    <br />
                    {orderDetail.direccion_snapshot.ciudad}, {orderDetail.direccion_snapshot.codigo_postal}
                  </div>
                </div>

                <h3>Items</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Producto</th>
                      <th style={{ textAlign: 'center', padding: '8px' }}>Cantidad</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>Precio</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDetail.items.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '8px' }}>
                          {item.producto_snapshot.nombre}
                          {item.ingredientes_excluidos.length > 0 && (
                            <div style={{ fontSize: '12px', color: '#888' }}>
                              Sin: {item.ingredientes_excluidos.join(', ')}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'center', padding: '8px' }}>{item.cantidad}</td>
                        <td style={{ textAlign: 'right', padding: '8px' }}>{formatPrice(item.precio_unitario)}</td>
                        <td style={{ textAlign: 'right', padding: '8px' }}>
                          {formatPrice(item.precio_unitario * item.cantidad)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold' }}>
                        Total:
                      </td>
                      <td style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold', fontSize: '18px' }}>
                        {formatPrice(orderDetail.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {orderDetail.historial.length > 0 && (
                  <>
                    <h3 style={{ marginTop: '20px' }}>Historial</h3>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {orderDetail.historial.map((h, idx) => (
                        <div key={idx} style={{ marginBottom: '8px' }}>
                          <strong>{formatDate(h.timestamp)}</strong>: {h.descripcion} 
                          {h.usuario_id && ` (Usuario #${h.usuario_id})`}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div>Error al cargar el detalle</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}