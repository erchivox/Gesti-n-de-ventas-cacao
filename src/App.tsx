// src/App.tsx
import { useState, useEffect } from 'react';
import VentaList from './components/VentaList';
import { DashboardMetrics } from './components/DashboardMetrics';
import { BatchUpload } from './components/BatchUpload';
import VentaForm from './components/VentaForm';
import RateManager from './components/RateManager';
import { db } from './lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import './App.css';

type Tab = 'dashboard' | 'registrar' | 'historial' | 'ia';

// Busca esta constante TABS y reordena así:
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'registrar', label: 'Registrar', emoji: '➕' },
  { id: 'historial', label: 'Historial', emoji: '📋' },
  { id: 'dashboard', label: 'Inicio',    emoji: '📊' },
  { id: 'ia',        label: 'IA Scan',   emoji: '📸' },
];
// Versión compacta de RateManager para el header móvil
function RateManagerCompact() {
  const [rate, setRate] = useState<number>(0);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'tasas'), (snap) => {
      if (snap.exists()) setRate(snap.data().bcv);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    const val = parseFloat(inputVal);
    if (isNaN(val) || val <= 0) return;
    await setDoc(doc(db, 'config', 'tasas'), { bcv: val, fecha: new Date() });
    setEditing(false);
    setInputVal('');
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          placeholder="Tasa"
          className="w-20 text-xs px-2 py-1 rounded-lg border outline-none"
          style={{ color: '#1e293b', backgroundColor: '#f8fafc', borderColor: '#6366f1' }}
          autoFocus
        />
        <button
          onClick={handleSave}
          className="text-xs px-2 py-1 rounded-lg font-bold text-white"
          style={{ backgroundColor: '#4f46e5', border: 'none' }}
        >✓</button>
        <button
          onClick={() => setEditing(false)}
          className="text-xs px-2 py-1 rounded-lg font-bold"
          style={{ color: '#94a3b8', backgroundColor: '#1e293b', border: 'none' }}
        >✕</button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex flex-col items-end rounded-lg px-3 py-1"
      style={{ backgroundColor: '#1e293b', border: 'none' }}
    >
      <span className="text-[9px] font-bold uppercase" style={{ color: '#64748b' }}>Tasa BCV</span>
      <span className="text-sm font-black" style={{ color: '#60a5fa' }}>Bs. {rate.toFixed(2)}</span>
    </button>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('registrar');

  return (
    <>
      {/* ========== DESKTOP (md+): layout de página normal ========== */}
      <div className="hidden md:block">
        <div className="container mx-auto p-6 max-w-5xl">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-extrabold app-title mb-2">
              Sistema de Gestión de Ventas
            </h1>
            <p className="text-lg font-semibold" style={{ color: '#a78bfa' }}>
              Productos de Cacao Artesanal
            </p>
            <p className="text-sm app-subtitle mt-1">
              Versión 3.0 · Digitalización y Procesamiento en Lote
            </p>
          </header>

          <RateManager />

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 section-title text-left">📊 Resumen de Flujo</h2>
            <DashboardMetrics />
          </section>
          <hr className="my-8" />

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 section-title text-left">📸 Digitalizar con IA</h2>
            <BatchUpload />
          </section>
          <hr className="my-8" />

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 section-title text-left">✏️ Registro Manual</h2>
            <div className="max-w-md mx-auto">
              <VentaForm />
            </div>
          </section>
          <hr className="my-8" />

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-6 section-title text-left">📋 Historial de Ventas</h2>
            <VentaList />
          </section>
          <hr className="my-8" />

          <section
            className="p-8 rounded-2xl border shadow-inner"
            style={{ background: 'linear-gradient(135deg, #1e293b 0%, #1e1b4b 100%)', borderColor: '#334155' }}
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div
                className="flex-shrink-0 w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}
              >T</div>
              <div className="text-left">
                <h2 className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>Trino Carrisales</h2>
                <p className="font-semibold mb-2" style={{ color: '#a78bfa' }}>Estudiante de Ingeniería en Informática</p>
                <p className="leading-relaxed max-w-2xl text-sm" style={{ color: '#94a3b8' }}>
                  Apasionado por el desarrollo de soluciones tecnológicas que optimicen procesos manuales.
                  Este sistema integra Gemini AI y Firebase para digitalizar la gestión artesanal del cacao.
                </p>
                <div className="mt-4 flex gap-3 flex-wrap">
                  <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: '#1e3a5f', color: '#60a5fa' }}>React + TypeScript</span>
                  <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: '#431407', color: '#fb923c' }}>Firebase</span>
                  <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: '#2e1065', color: '#c084fc' }}>Gemini AI</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ========== MÓVIL (< md): navegación por tabs ========== */}
      <div
        className="md:hidden flex flex-col"
        style={{ minHeight: '100dvh', backgroundColor: '#0f172a' }}
      >
        {/* Header fijo */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-4 pt-4 pb-3"
          style={{ borderBottom: '1px solid #1e293b' }}
        >
          <div>
            <h1 className="text-base font-extrabold leading-tight" style={{ color: '#f1f5f9' }}>
              Gestión de Ventas
            </h1>
            <p className="text-[10px]" style={{ color: '#a78bfa' }}>Cacao Artesanal</p>
          </div>
          <RateManagerCompact />
        </header>

        {/* Contenido scrolleable */}
        <main className="flex-1 overflow-y-auto px-3 pt-4 pb-28">

          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              <SectionLabel>Resumen General</SectionLabel>
              <DashboardMetrics />
            </div>
          )}

          {activeTab === 'registrar' && (
            <div className="space-y-4">
              <SectionLabel>Nuevo Registro</SectionLabel>
              <VentaForm />
            </div>
          )}

          {activeTab === 'historial' && (
            <div className="space-y-4">
              <SectionLabel>Historial de Ventas</SectionLabel>
              <VentaList />
            </div>
          )}

          {activeTab === 'ia' && (
            <div className="space-y-4">
              <SectionLabel>Digitalizar con IA</SectionLabel>
              <BatchUpload />
            </div>
          )}

        </main>

        {/* Tab bar fija en la parte inferior */}
        <nav
          className="fixed bottom-0 left-0 right-0 flex z-50"
          style={{
            backgroundColor: '#0f172a',
            borderTop: '1px solid #1e293b',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center justify-center py-3 transition-all"
                style={{
                  color: isActive ? '#a78bfa' : '#475569',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderTop: isActive ? '2px solid #a78bfa' : '2px solid transparent',
                }}
              >
                <span className="text-lg leading-none">{tab.emoji}</span>
                <span className="text-[10px] mt-1 font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>
      {children}
    </p>
  );
}

export default App;