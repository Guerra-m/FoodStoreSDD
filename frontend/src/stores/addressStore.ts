import { create } from 'zustand';
import { addressApi, Direccion, DireccionCreate, DireccionUpdate } from '../api/address';

/**
 * Store para la gestión de direcciones del cliente.
 * Mantiene la lista de direcciones en memoria para acceso rápido.
 */
interface AddressState {
  direcciones: Direccion[];
  loading: boolean;
  error: string | null;
  direccionPrincipal: Direccion | null;

  fetchDirecciones: () => Promise<void>;
  createDireccion: (data: DireccionCreate) => Promise<Direccion>;
  updateDireccion: (id: number, data: DireccionUpdate) => Promise<void>;
  deleteDireccion: (id: number) => Promise<void>;
  setPrincipal: (id: number) => Promise<void>;
}

export const useAddressStore = create<AddressState>()((set, get) => ({
  direcciones: [],
  loading: false,
  error: null,
  direccionPrincipal: null,

  fetchDirecciones: async () => {
    set({ loading: true, error: null });
    try {
      const direcciones = await addressApi.list();
      const direccionPrincipal = direcciones.find(d => d.es_principal) || null;
      set({ direcciones, direccionPrincipal, loading: false });
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || 'Error al cargar direcciones', loading: false });
    }
  },

  createDireccion: async (data: DireccionCreate) => {
    set({ loading: true, error: null });
    try {
      const direccion = await addressApi.create(data);
      const { direcciones } = get();
      const updated = [...direcciones, direccion];
      const direccionPrincipal = updated.find(d => d.es_principal) || null;
      set({ direcciones: updated, direccionPrincipal, loading: false });
      return direccion;
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || 'Error al crear dirección', loading: false });
      throw err;
    }
  },

  updateDireccion: async (id: number, data: DireccionUpdate) => {
    set({ loading: true, error: null });
    try {
      const updated = await addressApi.update(id, data);
      const { direcciones } = get();
      set({
        direcciones: direcciones.map(d => d.id === id ? updated : d),
        loading: false,
      });
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || 'Error al actualizar dirección', loading: false });
      throw err;
    }
  },

  deleteDireccion: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await addressApi.delete(id);
      const { direcciones } = get();
      const updated = direcciones.filter(d => d.id !== id);
      const direccionPrincipal = updated.find(d => d.es_principal) || null;
      set({ direcciones: updated, direccionPrincipal, loading: false });
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || 'Error al eliminar dirección', loading: false });
      throw err;
    }
  },

  setPrincipal: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const direccion = await addressApi.setPrincipal(id);
      const { direcciones } = get();
      const updated = direcciones.map(d => ({
        ...d,
        es_principal: d.id === id,
      }));
      set({ direcciones: updated, direccionPrincipal: direccion, loading: false });
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || 'Error al establecer dirección principal', loading: false });
      throw err;
    }
  },
}));
