//src/components/VentaForm.tsx
import React, { useState } from 'react';
import { db } from '../lib/firebase';
// Agregamos 'doc' y 'getDoc' para consultar la tasa actual
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';

// Definimos los precios constantes (Single Source of Truth para el formulario)
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
      // 1. OBTENER LA TASA BCV ACTUAL DE FIREBASE
      // Buscamos el documento que gestionamos en el componente RateManager
      const rateDocRef = doc(db, 'config', 'tasas');
      const rateDocSnap = await getDoc(rateDocRef);
      
      let tasaActual = 0;
      if (rateDocSnap.exists()) {
        tasaActual = rateDocSnap.data().bcv;
      } else {
        // Fallback por seguridad si no existe el documento de tasa
        alert("Atención: No se encontró una tasa BCV configurada. El registro se hará con tasa 0.");
      }

      // 2. REALIZAR CÁLCULOS (Snapshot)
      const totalUSD = (cono * PRECIOS_PRODUCTOS.cono) + 
                       (tableta * PRECIOS_PRODUCTOS.tableta) + 
                       (dulce * PRECIOS_PRODUCTOS.dulce);
      
      const totalBS = totalUSD * tasaActual;

      // 3. AGREGAR DOCUMENTO CON "SNAPSHOT" FINANCIERO
      await addDoc(collection(db, 'ventas'), {
        cliente,
        cacaoCono: cono,
        cacaoTableta: tableta,
        cacaoDulce: dulce,
        fecha: new Date(),
        estado: 'Pendiente',
        
        // Campos de auditoría financiera (Snapshot del momento)
        tasaBCVSnapshot: tasaActual,
        precioConoSnapshot: PRECIOS_PRODUCTOS.cono,
        precioTabletaSnapshot: PRECIOS_PRODUCTOS.tableta,
        precioDulceSnapshot: PRECIOS_PRODUCTOS.dulce,
        totalUSD: totalUSD,
        totalBS: totalBS
      });

      // Limpiar el formulario
      setCliente('');
      setCono(0);
      setTableta(0);
      setDulce(0);
      alert('Venta registrada con éxito con los montos actuales!');

    } catch (error) {
      console.error("Error al añadir documento: ", error);
      alert('Error al registrar la venta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded shadow bg-white">
      <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        <span>➕</span> Registrar Nueva Venta
      </h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente</label>
        <input
          type="text"
          placeholder="Ej: Trino Carrisales"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          required
          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
        />
      </div>

      <div className="space-y-3">
        <p className="font-semibold text-gray-700 border-b pb-1">Cantidades vendidas:</p>
        
        <div className="flex items-center justify-between">
          <label className="text-gray-600">Cacao Cono ($1.90):</label>
          <input 
            type="number" 
            value={cono} 
            min="0" 
            onChange={(e) => setCono(Number(e.target.value))} 
            className="p-1 border rounded w-20 text-center" 
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-gray-600">Cacao Tableta ($1.50):</label>
          <input 
            type="number" 
            value={tableta} 
            min="0" 
            onChange={(e) => setTableta(Number(e.target.value))} 
            className="p-1 border rounded w-20 text-center" 
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-gray-600">Cacao Dulce ($1.00):</label>
          <input 
            type="number" 
            value={dulce} 
            min="0" 
            onChange={(e) => setDulce(Number(e.target.value))} 
            className="p-1 border rounded w-20 text-center" 
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading} 
        className={`w-full mt-6 p-3 rounded font-bold text-white transition-colors ${
          loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {loading ? 'Procesando...' : 'Finalizar Registro'}
      </button>
    </form>
  );
};

export default VentaForm;