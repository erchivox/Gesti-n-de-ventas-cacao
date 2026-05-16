// src/components/VentaForm.tsx
import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';

const PRECIOS_PRODUCTOS = {
  cono: 1.9,
  tableta: 1.5,
  dulce: 1.0
};

const VentaForm: React.FC = () => {
  const [cliente, setCliente] = useState('');
  const [cono, setCono] = useState(0);
  const [tableta, setTableta] = useState(0);
  const [dulce, setDulce] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const rateDocRef = doc(db, 'config', 'tasas');
      const rateDocSnap = await getDoc(rateDocRef);

      let tasaActual = 0;
      if (rateDocSnap.exists()) {
        tasaActual = rateDocSnap.data().bcv;
      } else {
        alert("Atención: No se encontró una tasa BCV configurada. El registro se hará con tasa 0.");
      }

      const totalUSD = (cono * PRECIOS_PRODUCTOS.cono) +
                       (tableta * PRECIOS_PRODUCTOS.tableta) +
                       (dulce * PRECIOS_PRODUCTOS.dulce);

      const totalBS = totalUSD * tasaActual;

      await addDoc(collection(db, 'ventas'), {
        cliente,
        cacaoCono: cono,
        cacaoTableta: tableta,
        cacaoDulce: dulce,
        fecha: new Date(),
        estado: 'Pendiente',
        tasaBCVSnapshot: tasaActual,
        precioConoSnapshot: PRECIOS_PRODUCTOS.cono,
        precioTabletaSnapshot: PRECIOS_PRODUCTOS.tableta,
        precioDulceSnapshot: PRECIOS_PRODUCTOS.dulce,
        totalUSD: totalUSD,
        totalBS: totalBS
      });

      setCliente('');
      setCono(0);
      setTableta(0);
      setDulce(0);
      alert('Venta registrada con éxito!');

    } catch (error) {
      console.error("Error al añadir documento: ", error);
      alert('Error al registrar la venta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-xl shadow-lg" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
      <h3 className="text-xl font-bold mb-5 flex items-center gap-2" style={{ color: '#1e293b' }}>
        <span>➕</span> Registrar Nueva Venta
      </h3>

      <form onSubmit={handleSubmit}>
        {/* NOMBRE DEL CLIENTE */}
        <div className="mb-5">
          <label className="block text-sm font-semibold mb-1" style={{ color: '#475569' }}>
            Nombre del Cliente
          </label>
          <input
            type="text"
            placeholder="Ej: Trino Carrisales"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            required
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
            style={{ color: '#1e293b', backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}
          />
        </div>

        {/* CANTIDADES */}
        <div className="space-y-3">
          <p className="font-semibold pb-1 border-b" style={{ color: '#334155', borderColor: '#e2e8f0' }}>
            Cantidades vendidas:
          </p>

          {[
            { label: 'Cacao Cono', price: '1.90', value: cono, setter: setCono },
            { label: 'Cacao Tableta', price: '1.50', value: tableta, setter: setTableta },
            { label: 'Cacao Dulce', price: '1.00', value: dulce, setter: setDulce },
          ].map(({ label, price, value, setter }) => (
            <div key={label} className="flex items-center justify-between">
              <label className="text-sm font-medium" style={{ color: '#475569' }}>
                {label} <span style={{ color: '#6366f1' }}>(${price})</span>:
              </label>
              <input
                type="number"
                value={value}
                min="0"
                onChange={(e) => setter(Number(e.target.value))}
                className="p-1 border rounded-lg w-20 text-center focus:ring-2 focus:ring-indigo-400 outline-none"
                style={{ color: '#1e293b', backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}
              />
            </div>
          ))}
        </div>

        {/* TOTAL PREVIEW */}
        <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#f0f9ff', borderLeft: '3px solid #6366f1' }}>
          <p className="text-sm font-semibold" style={{ color: '#1e40af' }}>
            Total estimado: $
            {((cono * PRECIOS_PRODUCTOS.cono) + (tableta * PRECIOS_PRODUCTOS.tableta) + (dulce * PRECIOS_PRODUCTOS.dulce)).toFixed(2)}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-5 p-3 rounded-lg font-bold text-white transition-all"
          style={{
            backgroundColor: loading ? '#94a3b8' : '#4f46e5',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Procesando...' : 'Finalizar Registro'}
        </button>
      </form>
    </div>
  );
};

export default VentaForm;