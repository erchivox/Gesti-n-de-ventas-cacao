// src/components/VentaList.tsx

import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
// ¡Nuevos imports de Firebase para actualizar!
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore'; 
import type { DocumentData } from 'firebase/firestore';
import type { Venta } from '../types/Venta'; // Importamos el tipo Venta

const VentaList: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);

  // ----------------------------------------------------
  // 1. NUEVA FUNCIÓN: Lógica para actualizar el estado en Firebase
  // ----------------------------------------------------
  const handleConciliarPago = async (ventaId: string) => {
    // Confirmación simple antes de actualizar
    if (!window.confirm("¿Estás seguro de que quieres conciliar este pago?")) {
      return;
    }

    try {
      // 1. Crear una referencia al documento específico en la colección 'ventas'
      const ventaRef = doc(db, 'ventas', ventaId);

      // 2. Actualizar el campo 'estado' a 'Conciliado'
      await updateDoc(ventaRef, {
        estado: 'Conciliado'
      });

      alert('Pago conciliado con éxito!');
      // Gracias a onSnapshot, la tabla se actualizará automáticamente
    } catch (error) {
      console.error("Error al conciliar el pago: ", error);
      alert('Error al conciliar el pago. Revisa la consola.');
    }
  };
  // ----------------------------------------------------

  // useEffect para cargar y suscribirse a los cambios en Firestore
  useEffect(() => {
    // 1. Crear una consulta: a la colección 'ventas', ordenadas por fecha descendente
    const q = query(collection(db, 'ventas'), orderBy('fecha', 'desc'));

    // 2. Suscribirse a la colección (onSnapshot)
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ventasData: Venta[] = [];
      querySnapshot.forEach((doc: DocumentData) => {
        const data = doc.data();

        // 3. Transformar los datos de Firebase al formato de la interfaz Venta
        // Firebase Timestamp debe convertirse a objeto Date de JavaScript
        const venta: Venta = {
          id: doc.id, // Asignar el ID del documento
          cliente: data.cliente,
          cacaoCono: data.cacaoCono,
          cacaoTableta: data.cacaoTableta,
          cacaoDulce: data.cacaoDulce,
          estado: data.estado,
          // Convertir el Timestamp de Firebase a objeto Date
          fecha: data.fecha.toDate(), 
        };
        ventasData.push(venta);
      });
      
      setVentas(ventasData);
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener las ventas: ", error);
      setLoading(false);
    });

    // 4. Función de limpieza: Se ejecuta al desmontar el componente para evitar fugas de memoria
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <p className="text-center text-blue-500">Cargando ventas...</p>;
  }

  if (ventas.length === 0) {
    return <p className="text-center text-gray-500">Aún no hay ventas registradas. ¡Registra una!</p>;
  }

return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border-b">Cliente</th>
            <th className="py-2 px-4 border-b">Cacao de Cono (taza)</th>
            <th className="py-2 px-4 border-b">Cacao de Tableta (taza)</th>
            <th className="py-2 px-4 border-b">Cacao Dulce</th>
            <th className="py-2 px-4 border-b">Fecha</th>
            <th className="py-2 px-4 border-b">Estado</th>
            <th className="py-2 px-4 border-b">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ventas.map((venta) => {
            // 💡 Nuevo: Definimos las clases para la celda de Estado
            const estadoClases = venta.estado === 'Conciliado'
                ? 'estado-conciliado' // 👈 NUESTRA CLASE CSS PLANA
                : 'text-red-500';     // Mantendremos esta clase de Tailwind, ya que parece funcionar
            return (
              <tr key={venta.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b font-semibold">{venta.cliente}</td>
                <td className="py-2 px-4 border-b text-center">{venta.cacaoCono}</td>
                <td className="py-2 px-4 border-b text-center">{venta.cacaoTableta}</td>
                <td className="py-2 px-4 border-b text-center">{venta.cacaoDulce}</td>
                <td className="py-2 px-4 border-b">
                  {venta.fecha.toLocaleDateString()}
                </td>
                
                {/* 👈 Aplicamos la clase CSS personalizada aquí */}
                <td className={`py-2 px-4 border-b font-medium ${estadoClases}`}>
                    {venta.estado}
                </td>
                
                <td className="py-2 px-4 border-b text-center">
                  {venta.estado !== 'Conciliado' ? (
                    <button
                      onClick={() => handleConciliarPago(venta.id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Conciliar
                    </button>
                  ) : (
                    <span className="text-sm text-gray-500">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default VentaList;