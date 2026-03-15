from controller import Robot, Keyboard
import cv2
import numpy as np
import math

# --- 1. CONFIGURACIÓN INICIAL ---
robot = Robot()
timestep = int(robot.getBasicTimeStep())
keyboard = Keyboard()
keyboard.enable(timestep)

VELOCIDAD_MAX = 18.6
TAG_SIZE = 0.15

# --- 2. CONFIGURACIÓN DE HARDWARE ---
nombres_motores = [
    "Motor_Delantero_Izquierdo", "Motor_Delantero_Derecho", 
    "Motor_Trasero_Izquierdo", "Motor_Trasero_Derecho"
]
motores = []
for nombre in nombres_motores:
    m = robot.getDevice(nombre)
    m.setPosition(float('inf'))
    m.setVelocity(0.0)
    motores.append(m)

camara = robot.getDevice('camara_celular')
camara.enable(timestep)
imu = robot.getDevice('imu')
if imu: imu.enable(timestep)

# Detector AprilTag
try:
    from pupil_apriltags import Detector
    at_detector = Detector(families='tag36h11', nthreads=1)
except ImportError:
    print("❌ ERROR: Falta librería. pip install pupil-apriltags")
    raise

# --- 3. PARÁMETROS DE NAVEGACIÓN Y MAPA ---
width = camara.getWidth()
height = camara.getHeight()
focal_length = width / (2 * np.tan(1.1 / 2)) # FOV estándar
camera_params = [focal_length, focal_length, width/2, height/2]

# Tus distancias medidas respecto al Tag 0 (Fondo)
MAPA_PASILLOS = {
    1: 0.6,
    2: 2.0,
    3: 3.3,
    4: 4.5
}

# Vectores Mecanum CORREGIDOS
movimientos = {
    'adelante': [-1, -1, -1, -1],
    'atras':    [1, 1, 1, 1],
    'izq':      [1, -1, -1, 1],
    'der':      [-1, 1, 1, -1],
    'giro_izq': [1, -1, 1, -1],
    'giro_der': [-1, 1, -1, 1],
    'stop':     [0, 0, 0, 0]
}

# --- 4. FUNCIONES DE APOYO ---

def set_velocidad_motores(vector, velocidad):
    for i in range(4):
        motores[i].setVelocity(velocidad * vector[i])

def girar_a_grado(objetivo_grados):
    print(f"🔄 Girando a {objetivo_grados} grados...")
    while robot.step(timestep) != -1:
        rpy = imu.getRollPitchYaw()
        yaw_actual = math.degrees(rpy[2])
        error = objetivo_grados - yaw_actual
        while error > 180: error -= 360
        while error < -180: error += 360
        
        if abs(error) < 1.0:
            set_velocidad_motores(movimientos['stop'], 0)
            break
        
        v_giro = max(min(error * 0.15, 4.0), -4.0)
        motores[0].setVelocity(v_giro)
        motores[1].setVelocity(-v_giro)
        motores[2].setVelocity(v_giro)
        motores[3].setVelocity(-v_giro)

# --- 5. BUCLE PRINCIPAL / MÁQUINA DE ESTADOS ---
estado = "ESPERANDO_COMANDO"
pasillo_destino = None
distancia_objetivo_giro = 0.0

print("=== SISTEMA DE FARMACIA LISTO ===")
print("Presiona teclas 1, 2, 3 o 4 para seleccionar el pasillo.")

while robot.step(timestep) != -1:
    
    # Procesamiento de Imagen
    raw_image = camara.getImage()
    if not raw_image: continue
    
    img_np = np.frombuffer(raw_image, dtype=np.uint8).reshape((height, width, 4))
    img_color = img_np[:, :, :3].copy()
    gray = cv2.cvtColor(img_color, cv2.COLOR_BGR2GRAY)
    tags = at_detector.detect(gray, estimate_tag_pose=True, camera_params=camera_params, tag_size=TAG_SIZE)
   
    # Dibujar información de cada Tag detectado 
    for tag in tags:
        corners = tag.corners.astype(int)
        center = (int(tag.center[0]), int(tag.center[1]))
        top_most_y = np.min(corners[:, 1])
        corner_x = corners[0][0]
        
        # Dibujar polígono del tag y su ID
        cv2.polylines(img_color, [corners], isClosed=True, color=(0, 0, 255), thickness=3)
        distancia_z = tag.pose_t[2][0]

        cv2.putText(img_color, f"ID: {tag.tag_id}", (corner_x, top_most_y - 35), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        cv2.putText(img_color, f"Dist: {distancia_z:.2f} m", (corner_x, top_most_y - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

    # --- B. DIBUJAR ESTADO Y BRÚJULA ---


    # Brújula IMU (Arriba Derecha)
    rpy = imu.getRollPitchYaw()
    angulo_yaw = math.degrees(rpy[2])
    cv2.rectangle(img_color, (width - 180, 5), (width - 5, 45), (0,0,0), -1)
    cv2.putText(img_color, f"GIRO: {angulo_yaw:.1f} deg", (width - 170, 32), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    
    # Máquina de Estados
    if estado == "ESPERANDO_COMANDO":
        set_velocidad_motores(movimientos['stop'], 0)
        key = keyboard.getKey()
        if ord('1') <= key <= ord('4'):
            pasillo_destino = int(chr(key))
            distancia_objetivo_giro = MAPA_PASILLOS[pasillo_destino]
            estado = "AVANZAR_PRINCIPAL"
            print(f"🚀 Misión iniciada: Pasillo {pasillo_destino}")

    elif estado == "AVANZAR_PRINCIPAL":
        tag_referencia = next((t for t in tags if t.tag_id == 0), None)
        if tag_referencia:
            dist_actual = tag_referencia.pose_t[2][0]
            if dist_actual <= distancia_objetivo_giro:
                print("📍 Punto de giro alcanzado.")
                estado = "GIRAR_AL_PASILLO"
            else:
                set_velocidad_motores(movimientos['adelante'], VELOCIDAD_MAX * 0.4)
        else:
            set_velocidad_motores(movimientos['stop'], 0) # Seguridad si pierde el tag

    elif estado == "GIRAR_AL_PASILLO":
        girar_a_grado(-90) # Ajustar según si el pasillo está a la der (-) o izq (+)
        estado = "ENTRAR_PASILLO"

    elif estado == "ENTRAR_PASILLO":
        tag_pasillo = next((t for t in tags if t.tag_id == pasillo_destino), None)
        if tag_pasillo:
            if tag_pasillo.pose_t[2][0] < 0.4:
                print("🏁 Llegué al destino.")
                estado = "ESPERANDO_COMANDO"
            else:
                set_velocidad_motores(movimientos['adelante'], VELOCIDAD_MAX * 0.3)
        else:
            set_velocidad_motores(movimientos['adelante'], VELOCIDAD_MAX * 0.2)

    # Dibujar info en pantalla
    cv2.putText(img_color, f"Estado: {estado}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
    cv2.imshow("Vista Robot", img_color)
    cv2.waitKey(1)

cv2.destroyAllWindows()