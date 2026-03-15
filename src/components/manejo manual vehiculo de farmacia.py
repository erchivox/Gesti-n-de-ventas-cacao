"""
Controlador Farmacia: Mecanum + Visión + FUSIÓN DE SENSORES (ToF + Ultrasonido)
Autor: Samuel (Tesis)
"""

from controller import Robot, Keyboard, DistanceSensor
import cv2
import numpy as np
import math

try:
    from pupil_apriltags import Detector
except ImportError:
    print("❌ ERROR: Falta librería. pip install pupil-apriltags")
    raise

# --- 1. CONFIGURACIÓN FÍSICA ---
VELOCIDAD_MAX = 18.6
PASO_ACELERACION = 1.0 
DISTANCIA_FRENO = 0.25 # Frenar si algo está a menos de 25cm

# --- 2. INICIALIZACIÓN ---
robot = Robot()
timestep = int(robot.getBasicTimeStep())
keyboard = Keyboard()
keyboard.enable(timestep)

# Motores
nombres_motores = [
    "Motor_Delantero_Izquierdo", "Motor_Delantero_Derecho", 
    "Motor_Trasero_Izquierdo", "Motor_Trasero_Derecho"
]
motores = []
for nombre in nombres_motores:
    motor = robot.getDevice(nombre)
    motor.setPosition(float('inf'))
    motor.setVelocity(0.0)
    motores.append(motor)

# Cámara
camara = robot.getDevice('camara_celular')
camara.enable(timestep)

# Giroscopio (IMU)
imu = robot.getDevice('imu')
if imu:
    imu.enable(timestep)

# --- SENSORES DE DISTANCIA (Híbridos) ---
# En Webots debes crear estos nodos DistanceSensor
nombres_sensores = {
    "tof_izq": "ToF I",      # Tipo: infra-red
    "tof_centro": "ToF C",   # Tipo: infra-red
    "tof_der": "ToF D",      # Tipo: infra-red
    "ultrasonido": "Ultra S" # Tipo: sonar (Detecta vidrio)
}
sensores = {}

print("📡 Iniciando Sistema de Sensores Híbrido...")
for nombre_webots, nombre_bonito in nombres_sensores.items():
    sensor = robot.getDevice(nombre_webots)
    if sensor:
        sensor.enable(timestep)
        sensores[nombre_webots] = sensor
    else:
        print(f"⚠️ FALTANTE: No encuentro el sensor '{nombre_webots}'")

# Detector AprilTag
# OPTIMIZACIÓN: quad_decimate=2.0 acelera la detección x2
at_detector = Detector(
    families='tag36h11', 
    nthreads=1, 
    quad_decimate=2.0, 
    quad_sigma=0.0, 
    refine_edges=1, 
    decode_sharpening=0.25, 
    debug=0
)

# Configuración Visión
contador_pasos = 0
FRECUENCIA_VISION = 10 # Si sigue lento, sube esto a 15
TAG_SIZE = 0.15 

# Params Cámara
width = camara.getWidth()
height = camara.getHeight()
fov = camara.getFov()
if fov is None: fov = 1.1
focal_length = width / (2 * np.tan(fov / 2))
cx = width / 2
cy = height / 2
camera_params = [focal_length, focal_length, cx, cy]

# Vectores
movimientos = {
    'adelante': [-1, -1, -1, -1],
    'atras':    [1, 1, 1, 1],
    'izq':      [1, -1, -1, 1],
    'der':      [-1, 1, 1, -1],
    'giro_izq': [1, -1, 1, -1],
    'giro_der': [-1, 1, -1, 1]
}

velocidad_actual = 0.0
ultimo_vector = [0, 0, 0, 0]

print("=== SISTEMA LISTO ===")

# Función auxiliar para dibujar texto con sombra (SUTIL)
def draw_text_shadow(img, text, pos, font, scale, color, thickness):
    # Sombra negra (Mismo grosor que el texto para no ser agresiva)
    cv2.putText(img, text, (pos[0]+1, pos[1]+1), font, scale, (0,0,0), thickness)
    # Texto color
    cv2.putText(img, text, pos, font, scale, color, thickness)

def girar_a_grado(objetivo_grados):
    """
    Hace que el robot gire hasta alcanzar un ángulo absoluto.
    objetivo_grados: Ángulo al que queremos llegar (ej. 90, 180, 0).
    """
    print(f"🔄 Girando a {objetivo_grados} grados...")
    
    while robot.step(timestep) != -1:
        # 1. Leer ángulo actual del IMU
        rpy = imu.getRollPitchYaw()
        yaw_actual = math.degrees(rpy[2])
        
        # 2. Calcular el error (distancia entre el actual y el objetivo)
        error = objetivo_grados - yaw_actual
        
        # Normalizar el error para que siempre tome el camino más corto
        # (Para que no gire 270° a la derecha si puede girar 90° a la izquierda)
        while error > 180: error -= 360
        while error < -180: error += 360
        
        # 3. Definir una tolerancia (ej. 0.5 grados) para detenerse
        if abs(error) < 0.5:
            # Detener motores
            for m in motores: m.setVelocity(0)
            print("✅ Giro completado.")
            break
            
        # 4. Velocidad proporcional al error (más lento al acercarse)
        velocidad_giro = error * 0.1  # Ganancia proporcional (puedes ajustarla)
        
        # Limitar la velocidad máxima para que no sea brusco
        if velocidad_giro > 5.0: velocidad_giro = 5.0
        if velocidad_giro < -5.0: velocidad_giro = -5.0
        
        # 5. Aplicar a los motores (Vector de giro_izq o giro_der)
        # giro_izq: [1, -1, 1, -1] -> Motor DI, DD, TI, TD
        motores[0].setVelocity(velocidad_giro)
        motores[1].setVelocity(-velocidad_giro)
        motores[2].setVelocity(velocidad_giro)
        motores[3].setVelocity(-velocidad_giro)


while robot.step(timestep) != -1:
    
    # --- A. LECTURA DE SENSORES ---
    angulo_yaw = 0.0
    if imu:
        rpy = imu.getRollPitchYaw()
        angulo_yaw = math.degrees(rpy[2])

    # Leer distancias
    lecturas = {}
    obstaculo_detectado = False
    sensor_que_detecto = ""

    for nombre, sensor in sensores.items():
        val = sensor.getValue()
        lecturas[nombre] = val
        
        # LÓGICA DE FUSIÓN DE SENSORES (Safety Layer)
        if val < DISTANCIA_FRENO:
            obstaculo_detectado = True
            sensor_que_detecto = nombre

    # --- B. CONTROL MOTORES ---
    key = keyboard.getKey()
    comando = None
    
    if key == ord('W'): comando = 'adelante'
    elif key == ord('S'): comando = 'atras'
    elif key == ord('A'): comando = 'izq'
    elif key == ord('D'): comando = 'der'
    elif key == ord('Q'): comando = 'giro_izq'
    elif key == ord('E'): comando = 'giro_der'

    # INTERVENCIÓN DE SEGURIDAD
    if obstaculo_detectado and comando == 'adelante':
        comando = None
        if velocidad_actual > 0: velocidad_actual -= PASO_ACELERACION * 2

    # Rampa de Velocidad
    if comando:
        target = VELOCIDAD_MAX
        ultimo_vector = movimientos[comando]
        if velocidad_actual < target:
            velocidad_actual += PASO_ACELERACION
            if velocidad_actual > target: velocidad_actual = target
    else:
        target = 0.0
        if velocidad_actual > 0:
            velocidad_actual -= PASO_ACELERACION
            if velocidad_actual < 0: velocidad_actual = 0

    for i in range(4):
        motores[i].setVelocity(velocidad_actual * ultimo_vector[i])

    # --- C. LÓGICA DE VISIÓN + HUD ---
    contador_pasos += 1
    if contador_pasos % FRECUENCIA_VISION == 0:
        
        raw_image = camara.getImage()
        if raw_image:
            img_np = np.frombuffer(raw_image, dtype=np.uint8).reshape((camara.getHeight(), camara.getWidth(), 4))
            img_color = img_np[:, :, :3].copy()
            gray = cv2.cvtColor(img_color, cv2.COLOR_BGR2GRAY)
            
            tags = at_detector.detect(gray, estimate_tag_pose=True, camera_params=camera_params, tag_size=TAG_SIZE)
            
            for tag in tags:
                corners = tag.corners.astype(int)
                center = (int(tag.center[0]), int(tag.center[1]))
                top_most_y = np.min(corners[:, 1])
                corner_x = corners[0][0]
                
                cv2.polylines(img_color, [corners], isClosed=True, color=(0, 0, 255), thickness=3)
                distancia_z = tag.pose_t[2][0]

                draw_text_shadow(img_color, f"ID: {tag.tag_id}", (corner_x, top_most_y - 35), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
                draw_text_shadow(img_color, f"Dist: {distancia_z:.2f} m", (corner_x, top_most_y - 10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

            # --- HUD DE SENSORES (TRANSPARENTE) ---
            panel_x = width - 180
            
            # Alerta de Choque
            if obstaculo_detectado:
                cv2.rectangle(img_color, (0,0), (width, 30), (0,0,255), -1)
                cv2.putText(img_color, f"ALERTA: {sensor_que_detecto.upper()}", (10, 20), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

            y_pos = 40
            draw_text_shadow(img_color, f"YAW: {angulo_yaw:.1f}", (panel_x + 10, y_pos), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            y_pos += 30
            draw_text_shadow(img_color, "SENSORES:", (panel_x + 10, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
            
            colores = {"tof": (0, 255, 255), "ultra": (255, 0, 255)}
            
            for key, val in lecturas.items():
                y_pos += 25
                c = colores["tof"] if "tof" in key else colores["ultra"]
                txt = f"{key[:8]}: {val:.2f}m"
                if val < DISTANCIA_FRENO: c = (0, 0, 255)
                
                draw_text_shadow(img_color, txt, (panel_x + 10, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.5, c, 1)

            cv2.imshow("Vista Robot (Procesada)", img_color)
            cv2.waitKey(1)

cv2.destroyAllWindows()