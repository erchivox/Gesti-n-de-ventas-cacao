// src/components/VentaList.tsx

import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc,
  deleteDoc // 👈 ¡NUEVA IMPORTACIÓN!
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import type { Venta } from '../types/Venta';
import { BsTrash } from 'react-icons/bs'; // Para un ícono de basura 

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
  const handleDelete = async (ventaId: string) => {
      // Pedir confirmación antes de borrar
      if (window.confirm('¿Estás seguro de que deseas eliminar este registro de venta? Esta acción es irreversible.')) {
        try {
          const ventaRef = doc(db, 'ventas', ventaId);
          await deleteDoc(ventaRef); // Función de borrado de Firebase
          // console.log(`Venta ${ventaId} eliminada con éxito`);
        } catch (error) {
          console.error('Error al eliminar la venta: ', error);
          alert('Error al eliminar la venta. Revisa la consola para más detalles.');
        }
      }
    };
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
    return <p className="text-center text-blue-500">Cargando historial de ventas...</p>;
  }

  if (ventas.length === 0) {
    return <p className="text-center text-gray-500">Aún no hay ventas registradas. ¡Registra una!</p>;
  }

return (
    <div className="overflow-x-auto shadow-lg rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cacao de Cono</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cacao de Tableta</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cacao Dulce</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {ventas.map((venta) => {
            // Lógica para estilos condicionales (usando la clase CSS plana)
            const estadoClases = venta.estado === 'Conciliado'
              ? 'estado-conciliado' 
              : 'text-red-500';
            
            // Formatear la fecha para la UI
            const fechaFormateada = venta.fecha ? venta.fecha.toLocaleDateString() : 'N/A';

            return (
              <tr key={venta.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b font-medium text-gray-900">{venta.cliente}</td>
                <td className="py-2 px-4 border-b text-gray-700">{venta.cacaoCono}</td>
                <td className="py-2 px-4 border-b text-gray-700">{venta.cacaoTableta}</td>
                <td className="py-2 px-4 border-b text-gray-700">{venta.cacaoDulce}</td>
                <td className="py-2 px-4 border-b text-gray-700">{fechaFormateada}</td>
                
                {/* Celda del Estado */}
                <td className={`py-2 px-4 border-b font-medium ${estadoClases}`}>
                  {venta.estado}
                </td>
                
                {/* Celda de Acciones */}
                <td className="py-2 px-4 border-b space-x-2">
                  {venta.estado === 'Pendiente' && (
                    <button
                      onClick={() => handleConciliarPago(venta.id)}
                      className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 text-sm rounded transition duration-150"
                    >
                      Conciliar
                    </button>
                  )}
                  {/* 👈 ¡NUEVO BOTÓN DE ELIMINAR! */}
                  <button
                    onClick={() => handleDelete(venta.id)}
                    className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 text-sm rounded transition duration-150 flex items-center justify-center"
                    title="Eliminar registro"
                  >
                    <BsTrash className="mr-1" /> Eliminar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {ventas.length === 0 && <p className="text-center py-4 text-gray-500">No hay ventas registradas.</p>}
    </div>
  );
};

export default VentaList;