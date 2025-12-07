// src/components/BatchUpload.tsx

import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import type { Venta } from '../types/Venta';

// 👈 Importación de la librería de Google
import { GoogleGenAI } from '@google/genai';

// Inicializar el cliente de Gemini
// Usa la variable de entorno expuesta por Vite (VITE_...)
// src/components/BatchUpload.tsx (Modificación TEMPORAL)

// Reemplaza "TU_CLAVE_API_REAL_AQUI" con tu clave.
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_API_KEY || "AIzaSyDQvJOS3xQr1i6D-GoPQRfuXHcBnxKs34k" });
// ...

// Define la estructura de datos que esperamos de Gemini para cada fila
interface ParsedRecord {
    cliente: string;
    cacaoCono: number;
    cacaoTableta: number;
    cacaoDulce: number;
}


// Función auxiliar para convertir el archivo a Base64
const fileToGenerativePart = (file: File) => {
    return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64Data = (reader.result as string).split(',')[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type,
                },
            });
        };
        reader.readAsDataURL(file);
    });
};

export const BatchUpload: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [message, setMessage] = useState('');

    // ... handleFileChange es el mismo ...
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setUploadFile(e.target.files[0]);
            setMessage(`Archivo listo para escanear: ${e.target.files[0].name}`);
        }
    };

    // ----------------------------------------------------
    // LÓGICA DE PROCESAMIENTO REAL CON GEMINI
    // ----------------------------------------------------
    const handleScanAndSave = async () => {
        if (!uploadFile) {
            setMessage('Por favor, selecciona una imagen de la tabla para escanear.');
            return;
        }

        setIsProcessing(true);
        setMessage('🤖 Procesando imagen con Gemini AI. Esto puede tardar unos segundos...');

        try {
            // 1. Convertir la imagen a Base64
            const imagePart = await fileToGenerativePart(uploadFile);

            // 2. Definir el prompt (la instrucción para la IA)
            const prompt = `Analiza la siguiente tabla de ventas.
             Ignora los encabezados de columna 'nombre', 'Cacao de cono (taza)', 'Cacao de tableta(taza)' y 
             'Cacao dulce'. Extrae cada fila de datos (Trino, Carlos, Juan, etc.) y 
             convierte la información en un array de objetos JSON que se ajuste estrictamente al 
             siguiente formato TypeScript, sin incluir ninguna explicación o texto adicional. 
             La propiedad 'cliente' debe ser el nombre, y las propiedades de cacao deben ser números:
            
            [
              { cliente: string, cacaoCono: number, cacaoTableta: number, cacaoDulce: number },
              // ... más registros
            ]`;

            // 3. Llamar a la API de Gemini
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    imagePart,
                    { text: prompt }
                ],
            });

            // 4. Procesar la respuesta
            // response.text puede ser undefined; manejamos el caso y validamos antes de parsear
            let responseText = '';
            if (response && typeof (response as any).text === 'string') {
                responseText = (response as any).text.trim();
            } else if (response && (response as any).candidates && Array.isArray((response as any).candidates) && (response as any).candidates[0]?.content) {
                // Fallback común para estructuras que devuelven candidates
                responseText = String((response as any).candidates[0].content).trim();
            }
            
            if (!responseText) {
                throw new Error('Respuesta vacía de Gemini: response.text es undefined o vacío.');
            }
            
            // Limpiar posibles bloques de código JSON que Gemini pueda añadir (e.g., ```json ... ```)
            if (responseText.startsWith('```')) {
                responseText = responseText.substring(responseText.indexOf('\n') + 1, responseText.lastIndexOf('```'));
            }
            
            const parsedData: ParsedRecord[] = JSON.parse(responseText);

            // 5. Guardar los registros en Firebase
            let savedRecords = 0;
            for (const record of parsedData) {
                const newVenta: Omit<Venta, 'id'> = {
                    cliente: record.cliente,
                    cacaoCono: Number(record.cacaoCono) || 0,
                    cacaoTableta: Number(record.cacaoTableta) || 0,
                    cacaoDulce: Number(record.cacaoDulce) || 0,
                    estado: 'Pendiente', // Por defecto, es Pendiente
                    fecha: new Date(), 
                };
                await addDoc(collection(db, 'ventas'), newVenta);
                savedRecords++;
            }

            setMessage(`✅ Éxito: Se procesó la imagen y se registraron ${savedRecords} nuevas ventas usando Gemini AI.`);
            setUploadFile(null);

        } catch (error) {
            console.error("Error completo de Gemini o JSON: ", error);
            setMessage('❌ Error en el procesamiento. Asegúrate de que la clave API es correcta y la imagen es clara.');
        } finally {
            setIsProcessing(false);
        }
    };
    
    // ----------------------------------------------------
    // RENDERIZADO (El JSX es el mismo que en V3.0)
    // ----------------------------------------------------
    return (
        <div className="p-6 border border-gray-300 rounded-lg shadow-md bg-white">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800">📸 Digitalizar Tabla de Ventas (Gemini AI)</h3>
            <p className="mb-4 text-gray-600">Sube una imagen de tu tabla de registro para el procesamiento OCR en tiempo real.</p>
            
            {/* ... JSX del botón y mensaje de estado (se mantiene igual) ... */}
            <div className="flex flex-col space-y-4">
                <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange} 
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={isProcessing}
                />

                <button
                    onClick={handleScanAndSave}
                    disabled={isProcessing || !uploadFile}
                    className={`py-3 px-6 rounded-lg text-white font-bold transition-colors duration-300 ${
                        (isProcessing || !uploadFile)
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                    {isProcessing ? '⏳ Escaneando y Registrando...' : '🖼️ Escanear con IA y Registrar Lote'}
                </button>
            </div>

            {message && (
                <p className={`mt-4 p-3 rounded text-sm ${message.startsWith('✅') ? 'bg-green-50 text-green-700' : message.startsWith('❌') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                    {message}
                </p>
            )}

            {/* Removemos la vista previa simulada ya que ahora es real */}
        </div>
    );
};