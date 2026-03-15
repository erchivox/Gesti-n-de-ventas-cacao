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
import { BsTrash, BsSearch, BsFileEarmarkExcel } from 'react-icons/bs'; // Agregamos iconos
import * as XLSX from 'xlsx'; // mod xlsx

const VentaList: React.FC = () => {
  const [ventas, setVentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 🆕 ESTADOS PARA FILTROS ---
  const [filterNombre, setFilterNombre] = useState('');
  const [filterEstado, setFilterEstado] = useState('Todos');
  // Reemplazamos filterFecha por rango:
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  
  // --- 🆕 FUNCIÓN PARA EXPORTAR (MOD XLSX) ---
  const exportToExcel = (tipo: 'filtrado' | 'total') => {
    // Seleccionamos qué datos usar
    const datosRaw = tipo === 'filtrado' ? ventasFiltradas : ventas;
    
    if (datosRaw.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    // Formateamos los datos para que el Excel sea legible
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

    // Creamos el libro y la hoja
    const worksheet = XLSX.utils.json_to_sheet(datosFormateados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");

    // Generamos el nombre del archivo con fecha actual
    const hoy = new Date().toISOString().split('T')[0];
    const nombreArchivo = tipo === 'filtrado' 
      ? `Reporte_Filtrado_${hoy}.xlsx` 
      : `Respaldo_Total_Ventas_${hoy}.xlsx`;

    // Descargamos
    XLSX.writeFile(workbook, nombreArchivo);
  }; // fin mod xlsx

  const handleConciliarPago = async (ventaId: string) => {
    if (!window.confirm("¿Estás seguro de que quieres conciliar este pago?")) return;
    try {
      await updateDoc(doc(db, 'ventas', ventaId), { estado: 'Conciliado' });
    } catch (error) { console.error("Error al conciliar:", error); }
  };

  const handleDelete = async (ventaId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este registro?')) {
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

  // --- 🆕 LÓGICA DE FILTRADO ---
  const ventasFiltradas = ventas.filter(venta => {
    // 1. Filtro por nombre (minúsculas para que no importe si escribes 'Trino' o 'trino')
    const matchNombre = venta.cliente.toLowerCase().includes(filterNombre.toLowerCase());
    
    // 2. Filtro por estado
    const matchEstado = filterEstado === 'Todos' || venta.estado === filterEstado;
    
  // Lógica de rango de fechas
    const fechaVentaStr = venta.fecha.toISOString().split('T')[0];
    
    const matchFecha = (() => {
      if (fechaDesde && fechaHasta) {
        return fechaVentaStr >= fechaDesde && fechaVentaStr <= fechaHasta;
      } else if (fechaDesde) {
        return fechaVentaStr >= fechaDesde;
      } else if (fechaHasta) {
        return fechaVentaStr <= fechaHasta;
      }
      return true; // Si no hay fechas, se muestra todo
    })();

    return matchNombre && matchEstado && matchFecha;
  });

  if (loading) return <p className="text-center text-blue-500">Cargando historial...</p>;

  return (
    <div className="space-y-4"> {/* Contenedor principal con espacio */}
      
      {/* --- 🆕 BARRA DE FILTROS --- */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
        {/* BUSCADOR NOMBRE */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Buscar Cliente</label>
          <div className="relative">
            <BsSearch className="absolute left-3 top-3 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar por nombre..."
              className="pl-9 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={filterNombre}
              onChange={(e) => setFilterNombre(e.target.value)}
            />
          </div>
        </div>

        {/* SELECT ESTADO */}
        <div className="w-48">
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Estado</label>
          <select 
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Conciliado">Conciliado</option>
          </select>
        </div>
          {/* RANGO DE FECHAS */}
        <div className="w-40">
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Desde</label>
          <input 
            type="date"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
        </div>
        {/* RANGO HASTA */}
        <div className="w-40">
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Hasta</label>
          <input 
            type="date"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </div>
        {/* BOTÓN LIMPIAR */}
        <button 
          onClick={() => { setFilterNombre(''); setFilterEstado('Todos'); setFechaDesde(''); setFechaHasta('') }}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md text-sm font-medium transition-colors"
        >
          Limpiar
        </button>
        {/* --- 🆕 BOTONES DE EXCEL (MOD XLSX) --- */}
        <div className="flex flex-col gap-2">
          <h3 className="text-gray-700 font-semibold text-sm">Opciones de Descarga en formato xlsx</h3>
          <button 
            onClick={() => exportToExcel('filtrado')}
            title="Exportar lo que ves en pantalla"
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-green-700 shadow-sm transition-all"
          >
            <BsFileEarmarkExcel />  Vista Actual
          </button>

          <button 
            onClick={() => exportToExcel('total')}
            title="Descargar todos los registros de la base de datos"
            className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-slate-800 shadow-sm transition-all"
          >
            <BsFileEarmarkExcel /> Respaldo Total
          </button>
        </div>
        {/* fin mod xlsx */}
      </div>

      {/* TABLA (Ahora usa ventasFiltradas en lugar de ventas) */}
      <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">Cliente</th>
              <th className="py-3 px-4 text-center text-xs font-bold text-gray-600 uppercase">Cacao Cono</th>
              <th className="py-3 px-4 text-center text-xs font-bold text-gray-600 uppercase">Cacao Tableta</th>
              <th className="py-3 px-4 text-center text-xs font-bold text-gray-600 uppercase">Cacao Dulce</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">Fecha</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-blue-600 uppercase bg-blue-50">Tasa BCV</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-green-700 uppercase">Total $</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-blue-700 uppercase">Total Bs.</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">Estado</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ventasFiltradas.length > 0 ? (
              ventasFiltradas.map((venta) => (
                <tr key={venta.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{venta.cliente}</td>
                  <td className="py-3 px-4 text-sm text-center text-gray-700">{venta.cacaoCono}</td>
                  <td className="py-3 px-4 text-sm text-center text-gray-700">{venta.cacaoTableta}</td>
                  <td className="py-3 px-4 text-sm text-center text-gray-700">{venta.cacaoDulce}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{venta.fecha.toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-sm font-mono text-blue-600 bg-blue-50/30">
                    {venta.tasaUsada > 0 ? `Bs. ${venta.tasaUsada.toFixed(2)}` : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-sm font-bold text-green-700">${venta.totalUSD.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm font-bold text-blue-700">Bs. {venta.totalBS.toLocaleString('es-VE', {minimumFractionDigits: 2})}</td>
                  <td className={`py-3 px-4 text-xs font-black uppercase ${venta.estado === 'Conciliado' ? 'text-green-600' : 'text-red-500'}`}>
                    {venta.estado}
                  </td>
                  <td className="py-3 px-4 space-x-2 flex items-center">
                    {venta.estado === 'Pendiente' && (
                      <button
                        onClick={() => handleConciliarPago(venta.id)}
                        className="bg-green-600 text-white px-2 py-1 text-[10px] rounded hover:bg-green-700 font-bold shadow-sm"
                      >
                        CONCILIAR
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(venta.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Eliminar"
                    >
                      <BsTrash size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="py-10 text-center text-gray-400 italic">
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