// src/components/DashboardMetrics.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import type { Venta } from '../types/Venta';

// Interfaz para almacenar los totales de las métricas
interface Metrics {
  totalVentas: number;
  unidadesPendientes: number;
  unidadesConciliadas: number;
}

export const DashboardMetrics: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);

  // ----------------------------------------------------
  // 1. Suscripción a Firebase para obtener TODAS las ventas
  // ----------------------------------------------------
  useEffect(() => {
    // No necesitamos ordenar para las métricas, solo obtener todos los datos
    const q = query(collection(db, 'ventas')); 

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ventasData: Venta[] = [];
      querySnapshot.forEach((doc: DocumentData) => {
        const data = doc.data();

        // Transformamos los datos (aseguramos el tipo number para las cantidades)
        const venta: Venta = {
          id: doc.id,
          cliente: data.cliente,
          cacaoCono: Number(data.cacaoCono) || 0, // Aseguramos que sea un número
          cacaoTableta: Number(data.cacaoTableta) || 0,
          cacaoDulce: Number(data.cacaoDulce) || 0,
          estado: data.estado,
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

    return () => unsubscribe();
  }, []);

  // ----------------------------------------------------
  // 2. CÁLCULO DE MÉTRICAS (Usamos useMemo para optimizar)
  // ----------------------------------------------------
  const metrics = useMemo<Metrics>(() => {
    let unidadesPendientes = 0;
    let unidadesConciliadas = 0;
    
    ventas.forEach(venta => {
      // Suma de todas las unidades de productos en esta venta
      const totalUnidadesVenta = venta.cacaoCono + venta.cacaoTableta + venta.cacaoDulce;

      if (venta.estado === 'Pendiente') {
        unidadesPendientes += totalUnidadesVenta;
      } else if (venta.estado === 'Conciliado') {
        unidadesConciliadas += totalUnidadesVenta;
      }
    });

    return {
      totalVentas: ventas.length,
      unidadesPendientes,
      unidadesConciliadas
    };
  }, [ventas]); // Recalcular solo cuando la lista de ventas cambie

  if (loading) {
    return <p className="text-center text-blue-500">Cargando métricas...</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      
      {/* Tarjeta 1: Total de Registros */}
      <div className="p-4 bg-gray-100 rounded-lg shadow-md border-l-4 border-gray-500">
        <h4 className="text-sm font-semibold text-gray-600">Total de Registros</h4>
        <p className="text-3xl font-bold text-gray-900">{metrics.totalVentas}</p>
        <span className="text-xs text-gray-500">Ventas totales en el sistema</span>
      </div>
      
      {/* Tarjeta 2: Unidades Pendientes */}
      <div className="p-4 bg-red-100 rounded-lg shadow-md border-l-4 border-red-500">
        <h4 className="text-sm font-semibold text-red-700">Unidades Pendientes de Pago</h4>
        <p className="text-3xl font-bold text-red-800">{metrics.unidadesPendientes}</p>
        <span className="text-xs text-red-600">Unidades de producto por conciliar</span>
      </div>
      
      {/* Tarjeta 3: Unidades Conciliadas */}
      <div className="p-4 bg-green-100 rounded-lg shadow-md border-l-4 border-green-500">
        <h4 className="text-sm font-semibold text-green-700">Unidades Conciliadas (Pagadas)</h4>
        <p className="text-3xl font-bold text-green-800">{metrics.unidadesConciliadas}</p>
        <span className="text-xs text-green-600">Unidades de producto ya pagadas</span>
      </div>

    </div>
  );
};
