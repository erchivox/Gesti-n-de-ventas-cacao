# --- MÁQUINA DE ESTADOS MODIFICADA ---
    
    if estado == "ESPERANDO_COMANDO":
        set_velocidad_motores(movimientos['stop'], 0)
        key = keyboard.getKey()
        
        if ord('0') <= key <= ord('4'):
            nuevo_destino = int(chr(key))
            
            # CASO A: Ir a HOME (0)
            if nuevo_destino == 0:
                print("🏠 Comando recibido: Volver a HOME")
                # Si estamos dentro de un pasillo, primero hay que salir
                if pasillo_destino is not None:
                    estado = "SALIENDO_PASILLO"
                else:
                    estado = "REGRESANDO_A_CASA"
                pasillo_destino = None # Home no tiene ID de pasillo lateral
            
            # CASO B: Ir a un Pasillo (1-4)
            else:
                distancia_objetivo_giro = MAPA_PASILLOS[nuevo_destino]
                # Si ya estamos en un pasillo diferente, primero salimos al principal
                if pasillo_destino is not None and pasillo_destino != nuevo_destino:
                    print(f"🔄 Cambiando de Pasillo {pasillo_destino} a {nuevo_destino}")
                    estado = "SALIENDO_PASILLO"
                    # Guardamos el próximo destino para usarlo al salir
                    proximo_pasillo = nuevo_destino 
                else:
                    print(f"🚀 Yendo al Pasillo {nuevo_destino}")
                    pasillo_destino = nuevo_destino
                    estado = "AVANZAR_PRINCIPAL"

    elif estado == "AVANZAR_PRINCIPAL":
        tag_ref = next((t for t in tags if t.tag_id == 0), None)
        if tag_ref:
            dist_actual = tag_ref.pose_t[2][0]
            # Si estamos a la distancia de giro, nos detenemos y giramos
            if abs(dist_actual - distancia_objetivo_giro) < 0.1: # Tolerancia de 10cm
                set_velocidad_motores(movimientos['stop'], 0)
                estado = "GIRAR_AL_PASILLO"
            # Si el Tag 0 está más lejos que el objetivo, avanzamos
            elif dist_actual > distancia_objetivo_giro:
                set_velocidad_motores(movimientos['adelante'], VELOCIDAD_MAX * 0.4)
            # Si nos pasamos (el Tag 0 está más cerca), retrocedemos
            else:
                set_velocidad_motores(movimientos['atras'], VELOCIDAD_MAX * 0.4)
        else:
            set_velocidad_motores(movimientos['stop'], 0)

    elif estado == "ENTRAR_PASILLO":
        tag_obj = next((t for t in tags if t.tag_id == pasillo_destino), None)
        if tag_obj:
            if tag_obj.pose_t[2][0] < 0.4:
                print(f"🏁 Detenido en Pasillo {pasillo_destino}. Esperando siguiente orden...")
                set_velocidad_motores(movimientos['stop'], 0)
                estado = "ESPERANDO_COMANDO" # SE QUEDA AQUÍ HASTA NUEVA ORDEN
            else:
                set_velocidad_motores(movimientos['adelante'], VELOCIDAD_MAX * 0.3)

    elif estado == "SALIENDO_PASILLO":
        # Retrocede hasta salir al pasillo principal (3.7m)
        tag_obj = next((t for t in tags if t.tag_id == pasillo_destino), None)
        if tag_obj:
            if tag_obj.pose_t[2][0] >= 3.7:
                print("📍 En pasillo principal. Reorientando...")
                set_velocidad_motores(movimientos['stop'], 0)
                # Al salir, siempre nos ponemos a 0 grados
                girar_a_grado(0)
                
                # Decidimos qué sigue: ¿Ir a Home o a otro pasillo?
                if pasillo_destino is None: # Si la orden era ir a Home
                    estado = "REGRESANDO_A_CASA"
                else:
                    # Si la orden era ir a otro pasillo
                    pasillo_destino = proximo_pasillo
                    distancia_objetivo_giro = MAPA_PASILLOS[pasillo_destino]
                    estado = "AVANZAR_PRINCIPAL"
            else:
                set_velocidad_motores(movimientos['atras'], VELOCIDAD_MAX * 0.3)