// src/components/VentaList.tsx
import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import {
  collection, onSnapshot, query, orderBy,
  doc, updateDoc, deleteDoc, getDoc
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { BsTrash, BsSearch, BsFileEarmarkExcel, BsChevronDown, BsChevronUp } from 'react-icons/bs';
import * as XLSX from 'xlsx';

const VentaList: React.FC = () => {
  const [ventas, setVentas] = useState<any[]>([]);
  const [tasaActual, setTasaActual] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [filterNombre, setFilterNombre] = useState('');
  const [filterEstado, setFilterEstado] = useState('Todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  // ✅ Suscripción en tiempo real a la tasa BCV
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'tasas'), (snap) => {
      if (snap.exists()) setTasaActual(snap.data().bcv ?? 0);
    });
    return () => unsub();
  }, []);

  // Suscripción a ventas
  useEffect(() => {
    const q = query(collection(db, 'ventas'), orderBy('fecha', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data: any[] = [];
      snap.forEach((d: DocumentData) => {
        const v = d.data();
        data.push({
          id: d.id,
          cliente: v.cliente,
          cacaoCono: v.cacaoCono ?? 0,
          cacaoTableta: v.cacaoTableta ?? 0,
          cacaoDulce: v.cacaoDulce ?? 0,
          estado: v.estado,
          fecha: v.fecha.toDate(),
          totalUSD: v.totalUSD ?? 0,
          // Para Pendientes: totalBS y tasa vienen de tiempo real (ver render)
          // Para Pagados: vienen del snapshot congelado guardado en Firebase
          totalBSCongelado: v.totalBS ?? null,
          tasaCongelada: v.tasaBCVSnapshot ?? null,
        });
      });
      setVentas(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ✅ Al pagar: congelar totalBS y tasa del momento del pago
  const handlePagar = async (ventaId: string, totalUSD: number) => {
    if (!window.confirm("¿Confirmar pago recibido? Se congelará la tasa BCV actual.")) return;
    try {
      // Leemos la tasa más reciente justo en este momento
      const rateSnap = await getDoc(doc(db, 'config', 'tasas'));
      const tasaPago = rateSnap.exists() ? rateSnap.data().bcv : tasaActual;
      const totalBSPago = totalUSD * tasaPago;

      await updateDoc(doc(db, 'ventas', ventaId), {
        estado: 'Pagado',
        tasaBCVSnapshot: tasaPago,   // ← tasa congelada al momento del pago
        totalBS: totalBSPago,        // ← monto congelado en Bs.
        fechaPago: new Date(),
      });
    } catch (error) {
      console.error("Error al registrar pago:", error);
      alert('Error al registrar el pago.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar este registro permanentemente?")) return;
    try { await deleteDoc(doc(db, 'ventas', id)); }
    catch (error) { console.error("Error al eliminar:", error); }
  };

  // ✅ Helper: obtener el totalBS y tasa a mostrar según estado
  const getTotalesVenta = (venta: any) => {
    if (venta.estado === 'Pagado') {
      // Congelado: usar lo guardado en Firebase
      return {
        totalBS: venta.totalBSCongelado ?? venta.totalUSD * tasaActual,
        tasa: venta.tasaCongelada ?? tasaActual,
        esVivo: false,
      };
    } else {
      // Pendiente: calcular en tiempo real con tasa vigente
      return {
        totalBS: venta.totalUSD * tasaActual,
        tasa: tasaActual,
        esVivo: true,
      };
    }
  };

  const exportToExcel = (tipo: 'filtrado' | 'total') => {
    const datosRaw = tipo === 'filtrado' ? ventasFiltradas : ventas;
    if (datosRaw.length === 0) { alert("No hay datos para exportar."); return; }
    const datosFormateados = datosRaw.map(v => {
      const { totalBS, tasa } = getTotalesVenta(v);
      return {
        "Cliente": v.cliente,
        "Cacao Cono": v.cacaoCono,
        "Cacao Tableta": v.cacaoTableta,
        "Cacao Dulce": v.cacaoDulce,
        "Fecha Registro": v.fecha.toLocaleDateString(),
        "Tasa BCV (Bs.)": tasa,
        "Total USD ($)": v.totalUSD,
        "Total BS (Bs.)": totalBS,
        "Estado": v.estado
      };
    });
    const ws = XLSX.utils.json_to_sheet(datosFormateados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas");
    const hoy = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, tipo === 'filtrado' ? `Reporte_${hoy}.xlsx` : `Respaldo_${hoy}.xlsx`);
  };

  const ventasFiltradas = ventas.filter(v => {
    const matchNombre = v.cliente.toLowerCase().includes(filterNombre.toLowerCase());
    const matchEstado = filterEstado === 'Todos' || v.estado === filterEstado;
    const fStr = v.fecha.toISOString().split('T')[0];
    const matchFecha = (() => {
      if (fechaDesde && fechaHasta) return fStr >= fechaDesde && fStr <= fechaHasta;
      if (fechaDesde) return fStr >= fechaDesde;
      if (fechaHasta) return fStr <= fechaHasta;
      return true;
    })();
    return matchNombre && matchEstado && matchFecha;
  });

  const inputStyle = { color: '#1e293b', backgroundColor: '#ffffff', borderColor: '#cbd5e1' };
  const labelStyle: React.CSSProperties = {
    color: '#475569', fontSize: '0.65rem', fontWeight: 700,
    textTransform: 'uppercase', marginBottom: 4, display: 'block'
  };

  if (loading) return (
    <p className="text-center py-10 text-sm" style={{ color: '#60a5fa' }}>Cargando historial...</p>
  );

  return (
    <div className="space-y-3">

      {/* FILTROS */}
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
        <button
          className="w-full flex items-center justify-between px-4 py-3 md:hidden"
          style={{ backgroundColor: 'transparent', border: 'none', color: '#1e293b' }}
          onClick={() => setFiltrosAbiertos(f => !f)}
        >
          <span className="text-sm font-bold">🔍 Filtros y Exportar</span>
          {filtrosAbiertos ? <BsChevronUp /> : <BsChevronDown />}
        </button>

        <div className={`px-4 pb-4 ${filtrosAbiertos ? 'block' : 'hidden'} md:block`}>
          <div className="pt-3 flex flex-col md:flex-row flex-wrap gap-3 items-end">

            <div className="w-full md:flex-1 md:min-w-[200px]">
              <label style={labelStyle}>Buscar Cliente</label>
              <div className="relative">
                <BsSearch className="absolute left-3 top-3" style={{ color: '#94a3b8' }} />
                <input type="text" placeholder="Nombre..." className="pl-9 w-full py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 text-sm" style={inputStyle} value={filterNombre} onChange={e => setFilterNombre(e.target.value)} />
              </div>
            </div>

            <div className="w-full md:w-44">
              <label style={labelStyle}>Estado</label>
              <select className="w-full py-2.5 px-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 text-sm" style={inputStyle} value={filterEstado} onChange={e => setFilterEstado(e.target.value)}>
                <option value="Todos">Todos</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Pagado">Pagado</option>
              </select>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <div className="flex-1 md:w-36">
                <label style={labelStyle}>Desde</label>
                <input type="date" className="w-full py-2.5 px-3 border rounded-xl outline-none text-sm" style={inputStyle} value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
              </div>
              <div className="flex-1 md:w-36">
                <label style={labelStyle}>Hasta</label>
                <input type="date" className="w-full py-2.5 px-3 border rounded-xl outline-none text-sm" style={inputStyle} value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button onClick={() => { setFilterNombre(''); setFilterEstado('Todos'); setFechaDesde(''); setFechaHasta(''); }} className="flex-1 md:flex-none py-2 px-3 rounded-xl text-sm font-semibold" style={{ color: '#4f46e5', backgroundColor: '#eef2ff', border: 'none' }}>Limpiar</button>
              <button onClick={() => exportToExcel('filtrado')} className="flex-1 md:flex-none flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#16a34a', border: 'none' }}>
                <BsFileEarmarkExcel /> Vista
              </button>
              <button onClick={() => exportToExcel('total')} className="flex-1 md:flex-none flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#334155', border: 'none' }}>
                <BsFileEarmarkExcel /> Total
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tasa en uso */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs" style={{ color: '#64748b' }}>
          Tasa BCV activa: <strong style={{ color: '#60a5fa' }}>Bs. {tasaActual.toFixed(2)}</strong>
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
          🔴 EN VIVO
        </span>
        <span className="text-xs" style={{ color: '#64748b' }}>
          · {ventasFiltradas.length} registro{ventasFiltradas.length !== 1 ? 's' : ''}
        </span>
      </div>

      {ventasFiltradas.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <p className="text-4xl mb-2">🔍</p>
          <p className="text-sm italic" style={{ color: '#94a3b8' }}>No se encontraron ventas con esos filtros.</p>
        </div>
      ) : (
        <>
          {/* MÓVIL: tarjetas */}
          <div className="md:hidden space-y-3">
            {ventasFiltradas.map(venta => {
              const { totalBS, tasa, esVivo } = getTotalesVenta(venta);
              const isPagado = venta.estado === 'Pagado';
              return (
                <div
                  key={venta.id}
                  className="rounded-2xl p-4 shadow-sm"
                  style={{
                    backgroundColor: '#ffffff',
                    borderLeft: `4px solid ${isPagado ? '#16a34a' : '#f59e0b'}`,
                    border: `1px solid ${isPagado ? '#bbf7d0' : '#fde68a'}`,
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-sm" style={{ color: '#1e293b' }}>{venta.cliente}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{venta.fecha.toLocaleDateString()}</p>
                    </div>
                    <span
                      className="text-[10px] font-black uppercase px-2 py-1 rounded-full"
                      style={isPagado
                        ? { backgroundColor: '#dcfce7', color: '#15803d' }
                        : { backgroundColor: '#fef3c7', color: '#92400e' }}
                    >{venta.estado}</span>
                  </div>

                  <div className="flex gap-2 mb-3 flex-wrap">
                    {venta.cacaoCono > 0 && <Chip label="Cono" value={venta.cacaoCono} color="#7c3aed" />}
                    {venta.cacaoTableta > 0 && <Chip label="Tableta" value={venta.cacaoTableta} color="#0891b2" />}
                    {venta.cacaoDulce > 0 && <Chip label="Dulce" value={venta.cacaoDulce} color="#059669" />}
                  </div>

                  <div className="px-3 py-2 rounded-xl mb-3" style={{ backgroundColor: '#f8fafc' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs" style={{ color: '#64748b' }}>
                          Tasa: Bs. {tasa.toFixed(2)}
                          {esVivo && <span className="ml-1 text-[9px] font-bold" style={{ color: '#f59e0b' }}>● VIVO</span>}
                          {!esVivo && <span className="ml-1 text-[9px] font-bold" style={{ color: '#16a34a' }}>🔒 FIJADO</span>}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm" style={{ color: '#15803d' }}>${venta.totalUSD.toFixed(2)}</p>
                        <p className="font-bold text-xs" style={{ color: '#1d4ed8' }}>
                          Bs. {totalBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!isPagado && (
                      <button
                        onClick={() => handlePagar(venta.id, venta.totalUSD)}
                        className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                        style={{ backgroundColor: '#16a34a', border: 'none' }}
                      >✓ Marcar como Pagado</button>
                    )}
                    <button
                      onClick={() => handleDelete(venta.id)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none' }}
                    ><BsTrash size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP: tabla */}
          <div className="hidden md:block overflow-x-auto shadow-lg rounded-2xl border" style={{ borderColor: '#e2e8f0' }}>
            <table className="min-w-full divide-y" style={{ borderColor: '#e2e8f0' }}>
              <thead style={{ backgroundColor: '#f1f5f9' }}>
                <tr>
                  {['Cliente', 'Cono', 'Tableta', 'Dulce', 'Fecha', 'Tasa BCV', 'Total $', 'Total Bs.', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-bold uppercase" style={{ color: '#475569' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ backgroundColor: '#ffffff' }}>
                {ventasFiltradas.map(venta => {
                  const { totalBS, tasa, esVivo } = getTotalesVenta(venta);
                  const isPagado = venta.estado === 'Pagado';
                  return (
                    <tr key={venta.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ffffff')}
                    >
                      <td className="py-3 px-4 text-sm font-semibold" style={{ color: '#1e293b' }}>{venta.cliente}</td>
                      <td className="py-3 px-4 text-sm text-center" style={{ color: '#334155' }}>{venta.cacaoCono}</td>
                      <td className="py-3 px-4 text-sm text-center" style={{ color: '#334155' }}>{venta.cacaoTableta}</td>
                      <td className="py-3 px-4 text-sm text-center" style={{ color: '#334155' }}>{venta.cacaoDulce}</td>
                      <td className="py-3 px-4 text-sm" style={{ color: '#64748b' }}>{venta.fecha.toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-sm font-mono" style={{ color: '#2563eb', backgroundColor: '#eff6ff' }}>
                        Bs. {tasa.toFixed(2)}
                        {esVivo
                          ? <span className="ml-1 text-[9px] font-bold" style={{ color: '#f59e0b' }}>● VIVO</span>
                          : <span className="ml-1 text-[9px] font-bold" style={{ color: '#16a34a' }}>🔒</span>
                        }
                      </td>
                      <td className="py-3 px-4 text-sm font-bold" style={{ color: '#15803d' }}>
                        ${venta.totalUSD.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm font-bold" style={{ color: '#1d4ed8' }}>
                        Bs. {totalBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-black uppercase px-2 py-1 rounded-full"
                          style={isPagado
                            ? { backgroundColor: '#dcfce7', color: '#15803d' }
                            : { backgroundColor: '#fef3c7', color: '#92400e' }}>
                          {venta.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4 flex items-center gap-2">
                        {!isPagado && (
                          <button
                            onClick={() => handlePagar(venta.id, venta.totalUSD)}
                            className="px-2 py-1 text-xs rounded-lg font-bold text-white"
                            style={{ backgroundColor: '#16a34a', border: 'none' }}
                          >PAGAR</button>
                        )}
                        <button
                          onClick={() => handleDelete(venta.id)}
                          className="p-1 rounded"
                          style={{ color: '#ef4444', backgroundColor: 'transparent', border: 'none' }}
                        ><BsTrash size={16} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

function Chip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: `${color}15`, color }}>
      {label}: {value}
    </span>
  );
}

export default VentaList;