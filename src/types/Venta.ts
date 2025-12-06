// src/types/Venta.ts

// Usaremos un tipo más específico para el ID de Firebase
export type DocumentId = string;

export interface VentaData {
  cliente: string;
  cacaoCono: number;
  cacaoTableta: number;
  cacaoDulce: number;
  estado: "Pendiente" | "Conciliado";
  fecha: Date; // Usaremos el tipo Date para manejarlo en React
}

// Interfaz para la Venta completa que incluye el ID del documento
export interface Venta extends VentaData {
  id: DocumentId; // El ID único que Firebase asigna al documento
}
