// src/components/VentaForm.tsx
import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const PRECIOS_PRODUCTOS = { cono: 1.9, tableta: 1.5, dulce: 1.0 };

const PRODUCTOS = [
  { key: 'cono',    label: 'Cacao Cono',    price: '1.90', color: '#7c3aed' },
  { key: 'tableta', label: 'Cacao Tableta', price: '1.50', color: '#0891b2' },
  { key: 'dulce',   label: 'Cacao Dulce',   price: '1.00', color: '#059669' },
] as const;

type ProductKey = 'cono' | 'tableta' | 'dulce';

const VentaForm: React.FC = () => {
  const [cliente, setCliente] = useState('');
  const [cantidades, setCantidades] = useState<Record<ProductKey, number>>({
    cono: 0, tableta: 0, dulce: 0
  });
  const [loading, setLoading] = useState(false);

  const totalUSD =
    cantidades.cono * PRECIOS_PRODUCTOS.cono +
    cantidades.tableta * PRECIOS_PRODUCTOS.tableta +
    cantidades.dulce * PRECIOS_PRODUCTOS.dulce;

  const handleCantidad = (key: ProductKey, delta: number) => {
    setCantidades(prev => ({ ...prev, [key]: Math.max(0, prev[key] + delta) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente.trim()) return alert('Ingresa el nombre del cliente.');
    if (totalUSD === 0) return alert('Agrega al menos un producto.');
    setLoading(true);
    try {
      // ✅ NO guardamos tasaBCVSnapshot ni totalBS aquí.
      // El totalBS se calculará en tiempo real con la tasa vigente
      // y solo se congelará cuando se marque como Pagado.
      await addDoc(collection(db, 'ventas'), {
        cliente: cliente.trim(),
        cacaoCono: cantidades.cono,
        cacaoTableta: cantidades.tableta,
        cacaoDulce: cantidades.dulce,
        fecha: new Date(),
        estado: 'Pendiente',
        precioConoSnapshot: PRECIOS_PRODUCTOS.cono,
        precioTabletaSnapshot: PRECIOS_PRODUCTOS.tableta,
        precioDulceSnapshot: PRECIOS_PRODUCTOS.dulce,
        totalUSD,
        // totalBS y tasaBCVSnapshot se guardarán al momento del pago
      });

      setCliente('');
      setCantidades({ cono: 0, tableta: 0, dulce: 0 });
      alert('¡Venta registrada con éxito!');
    } catch (error) {
      console.error(error);
      alert('Error al registrar la venta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl shadow-lg overflow-hidden"
      style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
    >
      {/* Cabecera */}
      <div className="px-5 py-4" style={{ backgroundColor: '#4f46e5' }}>
        <h3 className="text-lg font-bold text-white">➕ Nueva Venta</h3>
        <p className="text-xs text-indigo-200 mt-0.5">Completa los datos del cliente</p>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        {/* Nombre */}
        <div>
          <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: '#475569' }}>
            Nombre del Cliente
          </label>
          <input
            type="text"
            placeholder="Ej: Trino Carrisales"
            value={cliente}
            onChange={e => setCliente(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            style={{ color: '#1e293b', backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}
          />
        </div>

        {/* Cantidades con +/- */}
        <div>
          <label className="block text-xs font-bold uppercase mb-3" style={{ color: '#475569' }}>
            Cantidades
          </label>
          <div className="space-y-3">
            {PRODUCTOS.map(({ key, label, price, color }) => (
              <div
                key={key}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>{label}</p>
                  <p className="text-xs font-bold" style={{ color }}>${price}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleCantidad(key, -1)}
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg transition-all active:scale-95"
                    style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none' }}
                  >−</button>
                  <span className="w-8 text-center text-base font-black" style={{ color: '#1e293b' }}>
                    {cantidades[key]}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCantidad(key, 1)}
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg transition-all active:scale-95"
                    style={{ backgroundColor: '#dcfce7', color: '#16a34a', border: 'none' }}
                  >+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total preview */}
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ backgroundColor: '#eef2ff', border: '1px solid #c7d2fe' }}
        >
          <div>
            <span className="text-sm font-bold" style={{ color: '#3730a3' }}>Total en USD</span>
            <p className="text-[10px] mt-0.5" style={{ color: '#6366f1' }}>
              El monto en Bs. se calculará con la tasa vigente al momento del pago
            </p>
          </div>
          <span className="text-xl font-black" style={{ color: '#4f46e5' }}>
            ${totalUSD.toFixed(2)}
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl font-bold text-white text-base transition-all active:scale-[0.98]"
          style={{
            backgroundColor: loading ? '#94a3b8' : '#4f46e5',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '⏳ Procesando...' : 'Finalizar Registro'}
        </button>
      </form>
    </div>
  );
};

export default VentaForm;