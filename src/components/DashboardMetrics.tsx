// src/components/DashboardMetrics.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, doc } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import type { Venta } from '../types/Venta';

interface Metrics {
  totalVentas: number;
  unidadesPendientes: number;
  unidadesPagadas: number;
  totalUSDPendiente: number;
  totalUSDPagado: number;
  totalBSPendiente: number; // calculado en vivo
}

export const DashboardMetrics: React.FC = () => {
  const [ventas, setVentas] = useState<any[]>([]);
  const [tasaActual, setTasaActual] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Tasa en tiempo real
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'tasas'), (snap) => {
      if (snap.exists()) setTasaActual(snap.data().bcv ?? 0);
    });
    return () => unsub();
  }, []);

  // Ventas en tiempo real
  useEffect(() => {
    const q = query(collection(db, 'ventas'));
    const unsub = onSnapshot(q, (snap) => {
      const data: any[] = [];
      snap.forEach((d: DocumentData) => {
        const v = d.data();
        data.push({
          id: d.id,
          cacaoCono: Number(v.cacaoCono) || 0,
          cacaoTableta: Number(v.cacaoTableta) || 0,
          cacaoDulce: Number(v.cacaoDulce) || 0,
          estado: v.estado,
          totalUSD: v.totalUSD ?? 0,
        });
      });
      setVentas(data);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const metrics = useMemo<Metrics>(() => {
    let unidadesPendientes = 0;
    let unidadesPagadas = 0;
    let totalUSDPendiente = 0;
    let totalUSDPagado = 0;

    ventas.forEach(v => {
      const units = v.cacaoCono + v.cacaoTableta + v.cacaoDulce;
      if (v.estado === 'Pendiente') {
        unidadesPendientes += units;
        totalUSDPendiente += v.totalUSD;
      } else if (v.estado === 'Pagado') {
        unidadesPagadas += units;
        totalUSDPagado += v.totalUSD;
      }
    });

    return {
      totalVentas: ventas.length,
      unidadesPendientes,
      unidadesPagadas,
      totalUSDPendiente,
      totalUSDPagado,
      totalBSPendiente: totalUSDPendiente * tasaActual,
    };
  }, [ventas, tasaActual]);

  if (loading) return (
    <div className="flex justify-center py-8">
      <p className="text-sm animate-pulse" style={{ color: '#60a5fa' }}>Cargando métricas...</p>
    </div>
  );

  const cards = [
    {
      title: 'Total Registros',
      value: metrics.totalVentas,
      sub: 'ventas en el sistema',
      emoji: '📦',
      bg: '#1e293b',
      accent: '#64748b',
      valueColor: '#f1f5f9',
      extra: null,
    },
    {
      title: 'Pendientes de Pago',
      value: metrics.unidadesPendientes,
      sub: `$${metrics.totalUSDPendiente.toFixed(2)} USD por cobrar`,
      emoji: '⏳',
      bg: '#fffbeb',
      accent: '#d97706',
      valueColor: '#92400e',
      extra: `Bs. ${metrics.totalBSPendiente.toLocaleString('es-VE', { minimumFractionDigits: 2 })} (tasa viva)`,
    },
    {
      title: 'Pagados',
      value: metrics.unidadesPagadas,
      sub: `$${metrics.totalUSDPagado.toFixed(2)} USD cobrados`,
      emoji: '✅',
      bg: '#f0fdf4',
      accent: '#16a34a',
      valueColor: '#14532d',
      extra: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map(card => (
        <div
          key={card.title}
          className="rounded-2xl p-4 shadow-sm flex items-center gap-4 sm:flex-col sm:items-start sm:gap-2"
          style={{ backgroundColor: card.bg, borderLeft: `4px solid ${card.accent}` }}
        >
          <span className="text-3xl sm:text-2xl flex-shrink-0">{card.emoji}</span>
          <div className="flex-1 sm:w-full">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: card.accent }}>
              {card.title}
            </p>
            <p className="text-3xl font-black leading-none mt-0.5" style={{ color: card.valueColor }}>
              {card.value}
            </p>
            <p className="text-xs mt-1" style={{ color: card.accent, opacity: 0.85 }}>
              {card.sub}
            </p>
            {card.extra && (
              <p className="text-xs mt-0.5 font-bold" style={{ color: card.accent }}>
                {card.extra}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};