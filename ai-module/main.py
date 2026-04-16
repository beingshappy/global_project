import cv2
import time
import requests
import base64
import numpy as np
import socketio
import platform
import threading
from datetime import datetime
from ultralytics import YOLO
from logic.risk_detector import analyze_risk
from logic.gesture_detector import GestureDetector
from deepface import DeepFace
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--camera_id', type=str, default='Camera-1', help='Name/Location of the Camera')
parser.add_argument('--source', type=str, default='0', help='Camera Source (0 for webcam, or RTSP URL / MP4 path)')
parser.add_argument('--confidence', type=float, default=0.5, help='YOLO detection threshold')
parser.add_argument('--deepface', type=str, default='true', help='Enable gender classification')
parser.add_argument('--lowlight', type=str, default='true', help='Enable low light enhancement')
args = parser.parse_args()

# Configuration
API_URL = "http://localhost:5000/api/events"
SOCKET_URL = "http://localhost:5000"
CAMERA_ID = int(args.source) if args.source.isdigit() else args.source
CAMERA_NAME = args.camera_id
NODE_ID = args.camera_id 
CONF_THRESHOLD = args.confidence
DEEPFACE_ENABLED = args.deepface.lower() == 'true'
LOWLIGHT_ENABLED = args.lowlight.lower() == 'true'

# Optimizations
FRAME_SKIP_HEAVY = 12
FRAME_SKIP_FAST = 3
COOLDOWN_SECONDS = 20
STREAM_FPS = 15

# Global AI Variables (Loaded in background)
yolo_model = None
gesture_detector = None
models_loaded = False

# Initialize Socket.io Client
sio = socketio.Client()

@sio.event
def connect():
    print(f"✅ Connected to Dashboard Stream Server | Node: {NODE_ID}")

@sio.event
def disconnect():
    print(f"❌ Disconnected from Dashboard Stream Server")

def try_connect_socket():
    for i in range(3):
        try:
            sio.connect(SOCKET_URL, transports=['websocket'])
            return
        except Exception as e:
            time.sleep(1)

def load_models_async():
    global yolo_model, gesture_detector, models_loaded
    try:
        print("🧠 Loading AI Models in background...")
        yolo_model = YOLO("yolov8n.pt") 
        gesture_detector = GestureDetector()
        models_loaded = True
        print("✨ AI System Ready.")
    except Exception as e:
        print(f"❌ [LazyLoad] Error loading models: {e}")

def enhance_low_light(frame):
    img_yuv = cv2.cvtColor(frame, cv2.COLOR_BGR2YUV)
    img_yuv[:, :, 0] = cv2.equalizeHist(img_yuv[:, :, 0])
    return cv2.cvtColor(img_yuv, cv2.COLOR_YUV2BGR)

def encode_frame(frame, quality=70):
    _, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
    return "data:image/jpeg;base64," + base64.b64encode(buffer).decode('utf-8')

def enhance_low_light(frame):
    """
    Applies CLAHE (Contrast Limited Adaptive Histogram Equalization) to 
    improve visibility in low-light conditions.
    """
    try:
        # Convert to YUV to separate luma from chroma
        yuv = cv2.cvtColor(frame, cv2.COLOR_BGR2YUV)
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8,8))
        # Enhance luma channel (Y)
        yuv[:,:,0] = clahe.apply(yuv[:,:,0])
        # Convert back
        return cv2.cvtColor(yuv, cv2.COLOR_YUV2BGR)
    except Exception as e:
        print(f"⚠️ Enhancement Error: {e}")
        return frame

def main():
    print(f"🚀 Starting Camera: {NODE_ID}")
    
    # 1. Start Model Load in Background Thread
    threading.Thread(target=load_models_async, daemon=True).start()

    # 2. Connect Socket
    try_connect_socket()

    # 3. Open Camera (Optimization: CAP_DSHOW for Windows)
    print(f"📸 Opening Camera: {CAMERA_ID}...")
    backend = cv2.CAP_DSHOW if (platform.system() == 'Windows' and isinstance(CAMERA_ID, int)) else cv2.CAP_ANY
    
    cap = None
    for attempt in range(1, 4):
        cap = cv2.VideoCapture(CAMERA_ID, backend)
        if cap.isOpened():
            ret, _ = cap.read()
            if ret:
                print(f"✅ Camera online on attempt {attempt}")
                break
        cap.release()
        time.sleep(1)
    else:
        print("❌ Error: Could not open camera.")
        sio.disconnect()
        return

    print("🛰️ Starting live feed...")
    frame_count = 0
    last_alert_time = 0
    
    last_persons = []
    last_persons_labels = []
    last_alert_text = ""
    last_alert_clear_time = 0
    
    women_count = 0
    men_count = 0
    is_sos = False

    while True:
        loop_start = time.time()
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.1)
            continue
            
        frame_count += 1
        display_frame = frame.copy()

        # ─── A. AI PROCESSING (Only if models are loaded) ───
        if models_loaded:
            # 1. FAST DETECTION (SOS)
            if frame_count % FRAME_SKIP_FAST == 0:
                is_sos, _ = gesture_detector.detect_sos(display_frame)

            # 2. HEAVY DETECTION (YOLO/DeepFace)
            if frame_count % FRAME_SKIP_HEAVY == 0:
                proc_frame = enhance_low_light(frame) if LOWLIGHT_ENABLED else frame.copy()
                results = yolo_model(proc_frame, classes=[0], verbose=False)
                
                last_persons = []
                for r in results:
                    for box in r.boxes:
                        x1, y1, x2, y2 = [int(i) for i in box.xyxy[0]]
                        if float(box.conf[0]) > CONF_THRESHOLD:
                            last_persons.append((x1, y1, x2, y2))
                
                women_count = 0
                men_count = 0
                last_persons_labels = []
                
                if DEEPFACE_ENABLED and len(last_persons) > 0:
                    for (x1, y1, x2, y2) in last_persons:
                        crop = proc_frame[max(0,y1):min(proc_frame.shape[0],y2), max(0,x1):min(proc_frame.shape[1],x2)]
                        if crop.size > 0:
                            try:
                                analysis = DeepFace.analyze(crop, actions=['gender'], enforce_detection=False, silent=True)
                                gen = analysis[0]['dominant_gender'] if isinstance(analysis, list) else analysis['dominant_gender']
                                if gen == 'Woman':
                                    women_count += 1
                                    last_persons_labels.append(("Woman", (255, 100, 180)))
                                else:
                                    men_count += 1
                                    last_persons_labels.append(("Man", (100, 180, 255)))
                            except:
                                last_persons_labels.append(("Person", (0, 220, 100)))
                else:
                    for _ in last_persons: last_persons_labels.append(("Person", (0, 220, 100)))

            # 3. ANALYSIS & ALERT
            risk_level, risk_type, conf_score = analyze_risk(women_count, men_count, datetime.now().hour)
            if is_sos:
                risk_level, risk_type, conf_score = 'HIGH', 'SOS_GESTURE_DETECTED', 0.99

            if risk_level in ['MEDIUM', 'HIGH'] and (time.time() - last_alert_time > COOLDOWN_SECONDS):
                payload = {
                    "location": CAMERA_NAME, "risk_type": risk_type, "confidence_score": conf_score,
                    "image_snapshot": encode_frame(display_frame, quality=80),
                    "women_count": women_count, "men_count": men_count
                }
                threading.Thread(target=lambda: requests.post(API_URL, json=payload), daemon=True).start()
                last_alert_time = time.time()
                last_alert_text = f"ALERT: {risk_type.replace('_',' ')}"
                last_alert_clear_time = time.time() + 3

        else:
            # While loading, show a subtle hint on screen
            if frame_count % 30 < 15:
                cv2.putText(display_frame, "AI LOADING...", (20, 30), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)

        # ─── B. OVERLAYS ───
        for i, (x1, y1, x2, y2) in enumerate(last_persons):
            label, color = last_persons_labels[i] if i < len(last_persons_labels) else ("Person", (0, 255, 0))
            cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 1)
            cv2.putText(display_frame, label, (x1, y1 - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
            
        if time.time() < last_alert_clear_time:
            cv2.putText(display_frame, last_alert_text, (30, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

        # ─── C. STREAM ───
        if sio.connected:
            stream_frame = cv2.resize(display_frame, (480, 360))
            encoded = encode_frame(stream_frame, quality=40)
            sio.emit('camera_frame', {'cameraId': NODE_ID, 'frame': encoded})

        # ─── D. CAP FPS ───
        elapsed = time.time() - loop_start
        wait = max(0, (1.0 / STREAM_FPS) - elapsed)
        time.sleep(wait)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    sio.disconnect()

if __name__ == "__main__":
    main()
