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
  deleteDoc
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { BsTrash, BsSearch, BsFileEarmarkExcel } from 'react-icons/bs';
import * as XLSX from 'xlsx';

const VentaList: React.FC = () => {
  const [ventas, setVentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterNombre, setFilterNombre] = useState('');
  const [filterEstado, setFilterEstado] = useState('Todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const exportToExcel = (tipo: 'filtrado' | 'total') => {
    const datosRaw = tipo === 'filtrado' ? ventasFiltradas : ventas;
    if (datosRaw.length === 0) { alert("No hay datos para exportar."); return; }

    const datosFormateados = datosRaw.map(v => ({
      "Cliente": v.cliente,
      "Cacao Cono": v.cacaoCono,
      "Cacao Tableta": v.cacaoTableta,
      "Cacao Dulce": v.cacaoDulce,
      "Fecha": v.fecha.toLocaleDateString(),
      "Tasa BCV (Bs.)": v.tasaUsada,
      "Total USD ($)": v.totalUSD,
      "Total BS (Bs.)": v.totalBS,
      "Estado": v.estado
    }));

    const worksheet = XLSX.utils.json_to_sheet(datosFormateados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");
    const hoy = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, tipo === 'filtrado' ? `Reporte_Filtrado_${hoy}.xlsx` : `Respaldo_Total_${hoy}.xlsx`);
  };

  const handleConciliarPago = async (ventaId: string) => {
    if (!window.confirm("¿Confirmar conciliación de este pago?")) return;
    try { await updateDoc(doc(db, 'ventas', ventaId), { estado: 'Conciliado' }); }
    catch (error) { console.error("Error al conciliar:", error); }
  };

  const handleDelete = async (ventaId: string) => {
    if (window.confirm('¿Eliminar este registro permanentemente?')) {
      try { await deleteDoc(doc(db, 'ventas', ventaId)); }
      catch (error) { console.error("Error al eliminar:", error); }
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'ventas'), orderBy('fecha', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ventasData: any[] = [];
      querySnapshot.forEach((doc: DocumentData) => {
        const data = doc.data();
        ventasData.push({
          id: doc.id,
          cliente: data.cliente,
          cacaoCono: data.cacaoCono,
          cacaoTableta: data.cacaoTableta,
          cacaoDulce: data.cacaoDulce,
          estado: data.estado,
          fecha: data.fecha.toDate(),
          totalUSD: data.totalUSD || 0,
          totalBS: data.totalBS || 0,
          tasaUsada: data.tasaBCVSnapshot || 0
        });
      });
      setVentas(ventasData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const ventasFiltradas = ventas.filter(venta => {
    const matchNombre = venta.cliente.toLowerCase().includes(filterNombre.toLowerCase());
    const matchEstado = filterEstado === 'Todos' || venta.estado === filterEstado;
    const fechaVentaStr = venta.fecha.toISOString().split('T')[0];
    const matchFecha = (() => {
      if (fechaDesde && fechaHasta) return fechaVentaStr >= fechaDesde && fechaVentaStr <= fechaHasta;
      if (fechaDesde) return fechaVentaStr >= fechaDesde;
      if (fechaHasta) return fechaVentaStr <= fechaHasta;
      return true;
    })();
    return matchNombre && matchEstado && matchFecha;
  });

  if (loading) return <p className="text-center" style={{ color: '#60a5fa' }}>Cargando historial...</p>;

  // Estilos reutilizables
  const inputStyle = {
    color: '#1e293b',
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
  };

  const labelStyle = {
    color: '#475569',
    fontSize: '0.7rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    marginBottom: '4px',
    display: 'block',
  };

  return (
    <div className="space-y-4">

      {/* BARRA DE FILTROS */}
      <div
        className="p-4 rounded-xl shadow-sm border flex flex-wrap gap-4 items-end"
        style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
      >
        {/* Buscar cliente */}
        <div className="flex-1 min-w-[200px]">
          <label style={labelStyle}>Buscar Cliente</label>
          <div className="relative">
            <BsSearch className="absolute left-3 top-3" style={{ color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              className="pl-9 w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-400"
              style={inputStyle}
              value={filterNombre}
              onChange={(e) => setFilterNombre(e.target.value)}
            />
          </div>
        </div>

        {/* Estado */}
        <div className="w-44">
          <label style={labelStyle}>Estado</label>
          <select
            className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-400"
            style={inputStyle}
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Conciliado">Conciliado</option>
          </select>
        </div>

        {/* Desde */}
        <div className="w-40">
          <label style={labelStyle}>Desde</label>
          <input
            type="date"
            className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            style={inputStyle}
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
        </div>

        {/* Hasta */}
        <div className="w-40">
          <label style={labelStyle}>Hasta</label>
          <input
            type="date"
            className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            style={inputStyle}
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </div>

        {/* Limpiar */}
        <button
          onClick={() => { setFilterNombre(''); setFilterEstado('Todos'); setFechaDesde(''); setFechaHasta(''); }}
          className="p-2 rounded-lg text-sm font-semibold transition-colors"
          style={{ color: '#4f46e5', backgroundColor: '#eef2ff' }}
        >
          Limpiar
        </button>

        {/* Exportar Excel */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase" style={{ color: '#64748b' }}>Exportar xlsx</p>
          <button
            onClick={() => exportToExcel('filtrado')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white shadow-sm transition-all hover:opacity-90"
            style={{ backgroundColor: '#16a34a' }}
          >
            <BsFileEarmarkExcel /> Vista Actual
          </button>
          <button
            onClick={() => exportToExcel('total')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white shadow-sm transition-all hover:opacity-90"
            style={{ backgroundColor: '#334155' }}
          >
            <BsFileEarmarkExcel /> Respaldo Total
          </button>
        </div>
      </div>

      {/* TABLA */}
      <div className="overflow-x-auto shadow-lg rounded-xl border" style={{ borderColor: '#e2e8f0' }}>
        <table className="min-w-full divide-y" style={{ borderColor: '#e2e8f0' }}>
          <thead style={{ backgroundColor: '#f1f5f9' }}>
            <tr>
              {['Cliente', 'Cono', 'Tableta', 'Dulce', 'Fecha', 'Tasa BCV', 'Total $', 'Total Bs.', 'Estado', 'Acciones'].map(h => (
                <th
                  key={h}
                  className="py-3 px-4 text-left text-xs font-bold uppercase"
                  style={{ color: '#475569' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ backgroundColor: '#ffffff' }}>
            {ventasFiltradas.length > 0 ? (
              ventasFiltradas.map((venta) => (
                <tr
                  key={venta.id}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid #f1f5f9' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                  <td className="py-3 px-4 text-sm font-semibold" style={{ color: '#1e293b' }}>{venta.cliente}</td>
                  <td className="py-3 px-4 text-sm text-center" style={{ color: '#334155' }}>{venta.cacaoCono}</td>
                  <td className="py-3 px-4 text-sm text-center" style={{ color: '#334155' }}>{venta.cacaoTableta}</td>
                  <td className="py-3 px-4 text-sm text-center" style={{ color: '#334155' }}>{venta.cacaoDulce}</td>
                  <td className="py-3 px-4 text-sm" style={{ color: '#64748b' }}>{venta.fecha.toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-sm font-mono" style={{ color: '#2563eb', backgroundColor: '#eff6ff' }}>
                    {venta.tasaUsada > 0 ? `Bs. ${venta.tasaUsada.toFixed(2)}` : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-sm font-bold" style={{ color: '#15803d' }}>
                    ${venta.totalUSD.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm font-bold" style={{ color: '#1d4ed8' }}>
                    Bs. {venta.totalBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className="text-xs font-black uppercase px-2 py-1 rounded-full"
                      style={
                        venta.estado === 'Conciliado'
                          ? { backgroundColor: '#dcfce7', color: '#15803d' }
                          : { backgroundColor: '#fee2e2', color: '#dc2626' }
                      }
                    >
                      {venta.estado}
                    </span>
                  </td>
                  <td className="py-3 px-4 flex items-center gap-2">
                    {venta.estado === 'Pendiente' && (
                      <button
                        onClick={() => handleConciliarPago(venta.id)}
                        className="px-2 py-1 text-xs rounded-lg font-bold text-white transition-all hover:opacity-90"
                        style={{ backgroundColor: '#16a34a' }}
                      >
                        CONCILIAR
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(venta.id)}
                      className="p-1 rounded transition-colors"
                      style={{ color: '#ef4444' }}
                      title="Eliminar"
                    >
                      <BsTrash size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="py-10 text-center italic" style={{ color: '#94a3b8' }}>
                  No se encontraron ventas con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VentaList;