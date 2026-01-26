// src/App.tsx (Asegúrate de importar BatchUpload)

import VentaList from './components/VentaList';
import { DashboardMetrics } from './components/DashboardMetrics';
import { BatchUpload } from './components/BatchUpload'; // ¡NUEVO IMPORT!
import VentaForm from './components/VentaForm'; // Mantén el formulario de momento
import './App.css';

function App() {
  return (
    <div className="container mx-auto p-4 max-w-4xl"> 
      <header className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-800">Sistema de Gestión de Ventas y Productos de Cacao Artesanal</h1>
        <p className="text-xl text-gray-600">Versión 3.0: Digitalización y Procesamiento en Lote</p>
      </header>
      
      {/*  Sección de Métricas (Dashboard) */}
      <section className="mb-8">
        <h2 className="text-3xl font-bold mb-4 text-gray-700 text-left"> Resumen de Flujo</h2>
        <DashboardMetrics />
      </section>
      
      <hr className="my-10" />

      {/*  Sección de Carga en Lote (V3.0) */}
      <section className="mb-10">
          <BatchUpload />
      </section>

      <hr className="my-10" />

      {/* Sección del Formulario (manteniendo la opción manual) */}
      <div className="max-w-md mx-auto mb-10">
        <h2 className="text-3xl font-bold mb-4 text-gray-700 text-left"> Registro Manual</h2>
        <VentaForm />
      </div>
      
      <hr className="my-10" />
      
      {/* Sección de la Lista de Ventas */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-gray-700"> Historial de Ventas</h2>
        <VentaList />
      </section>
      
        {/*  Sección: Sobre el Desarrollador */}
      <hr className="my-10" />
      <section className="bg-gradient-to-r from-gray-50 to-blue-50 p-8 rounded-2xl border border-gray-200 shadow-inner">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar / Iniciales */}
          <div className="flex-shrink-0 w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            T {/* Reemplaza con tu inicial o una imagen <img src="..." /> */}
          </div>

          {/* Información */}
          <div className="text-left">
            <h2 className="text-2xl font-bold text-gray-800">Trino Carrisales</h2>
            <p className="text-blue-600 font-semibold mb-2">Estudiante de Ingeniería en Informática</p>
            <p className="text-gray-600 leading-relaxed max-w-2xl">
              Apasionado por el desarrollo de soluciones tecnológicas que optimicen procesos manuales. 
              Este sistema nace de la necesidad de digitalizar la gestión artesanal del cacao 
              mediante la integración de Inteligencia Artificial (Gemini AI) y bases de datos en tiempo real.
            </p>
            
            {/* Enlaces de contacto (opcional) */}
            <div className="mt-4 flex gap-4">
              <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded">React + TypeScript</span>
              <span className="text-xs font-mono bg-orange-100 text-orange-700 px-2 py-1 rounded">Firebase</span>
              <span className="text-xs font-mono bg-purple-100 text-purple-700 px-2 py-1 rounded">Gemini AI</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;