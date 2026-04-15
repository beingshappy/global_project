import cv2
import time
import requests
import base64
import numpy as np
from datetime import datetime
from ultralytics import YOLO
from logic.risk_detector import analyze_risk
from logic.gesture_detector import GestureDetector

# NOTE: For faster real-time processing you can use a smaller YOLO model or skip DeepFace per frame.
# We will use DeepFace for gender classification.
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
CAMERA_ID = int(args.source) if args.source.isdigit() else args.source
CAMERA_NAME = args.camera_id
CONF_THRESHOLD = args.confidence
DEEPFACE_ENABLED = args.deepface.lower() == 'true'
LOWLIGHT_ENABLED = args.lowlight.lower() == 'true'

FRAME_SKIP = 10 # Process every 10th frame to save CPU
COOLDOWN_SECONDS = 5 # Avoid spamming the API

def enhance_low_light(frame):
    """Applies histogram equalization to handle low light conditions"""
    # Convert to YUV to equalize only the illuminance channel
    img_yuv = cv2.cvtColor(frame, cv2.COLOR_BGR2YUV)
    img_yuv[:, :, 0] = cv2.equalizeHist(img_yuv[:, :, 0])
    return cv2.cvtColor(img_yuv, cv2.COLOR_YUV2BGR)

def encode_frame(frame):
    """Encodes frame to Base64 for the API"""
    _, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
    return "data:image/jpeg;base64," + base64.b64encode(buffer).decode('utf-8')

def main():
    print("Initialize Models...")
    yolo_model = YOLO("yolov8n.pt") # Nanomodel for speed
    gesture_detector = GestureDetector()
    
    cap = cv2.VideoCapture(CAMERA_ID)
    if not cap.isOpened():
        print("Error: Could not open camera.")
        return

    print("System Online. Monitoring CV feed...")
    frame_count = 0
    last_alert_time = 0
    
    # Caching variables to prevent flickering on skipped frames
    last_persons = []
    last_persons_labels = []
    last_alert_text = ""
    last_alert_clear_time = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_count += 1
        
        # Display the raw feed always (optional)
        display_frame = frame.copy()

        # Process every Nth frame
        if frame_count % FRAME_SKIP == 0:
            
            # 1. Low light enhancement (Optional)
            proc_frame = enhance_low_light(frame) if LOWLIGHT_ENABLED else frame.copy()
            
            # 2. YOLO Human Detection
            results = yolo_model(proc_frame, classes=[0], verbose=False) # Class 0 is person
            
            last_persons = []
            
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    x1, y1, x2, y2 = [int(i) for i in box.xyxy[0]]
                    conf = float(box.conf[0])
                    
                    if conf > CONF_THRESHOLD:
                        last_persons.append((x1, y1, x2, y2))
            
            women_count = 0
            men_count = 0
            last_persons_labels = []
            
            # 3. Gender Classification (Optional)
            if DEEPFACE_ENABLED:
                for (x1, y1, x2, y2) in last_persons:
                    h, w, _ = proc_frame.shape
                    x1, y1 = max(0, x1), max(0, y1)
                    x2, y2 = min(w, x2), min(h, y2)
                    
                    crop = proc_frame[y1:y2, x1:x2]
                    if crop.size == 0: 
                        last_persons_labels.append(("Unknown", (0, 255, 0)))
                        continue
                    
                    try:
                        analysis = DeepFace.analyze(crop, actions=['gender'], enforce_detection=False, silent=True)
                        if isinstance(analysis, list): analysis = analysis[0]
                        dominant_gender = analysis['dominant_gender']
                        
                        if dominant_gender == 'Woman':
                            women_count += 1
                            last_persons_labels.append(("Woman", (0, 0, 255)))
                        else:
                            men_count += 1
                            last_persons_labels.append(("Man", (255, 0, 0)))
                    except Exception as e:
                        last_persons_labels.append(("Person", (0, 255, 0)))
            else:
                # If DeepFace is disabled, count all as People
                for (x1, y1, x2, y2) in last_persons:
                    last_persons_labels.append(("Detect", (0, 255, 0)))
                # For demo logic, split counts if disabled? No, just keep 0 for gender.


            # 4. Gesture Detection (SOS)
            is_sos, _ = gesture_detector.detect_sos(display_frame)

            # 5. Risk Assessment
            current_hour = datetime.now().hour
            risk_level, risk_type, conf_score = analyze_risk(women_count, men_count, current_hour)
            
            if is_sos:
                risk_level = 'HIGH'
                risk_type = 'SOS_GESTURE_DETECTED'
                conf_score = 0.99

            # 6. Trigger Alert System
            current_time = time.time()
            if risk_level in ['MEDIUM', 'HIGH'] and (current_time - last_alert_time > COOLDOWN_SECONDS):
                print(f"🚨 THREAT DETECTED: {risk_type} | W:{women_count} M:{men_count}")
                
                payload = {
                    "location": CAMERA_NAME,
                    "risk_type": risk_type,
                    "confidence_score": conf_score,
                    "image_snapshot": encode_frame(display_frame),
                    "women_count": women_count,
                    "men_count": men_count
                }
                
                # Asynchronous Request using Threading to avoid blocking CV loop
                import threading
                def send_alert():
                    try:
                        requests.post(API_URL, json=payload)
                    except Exception as e:
                        print(f"Failed to transmit alert to backend: {e}")
                        
                threading.Thread(target=send_alert, daemon=True).start()
                
                last_alert_time = current_time
                last_alert_text = "ALERT TRANSMITTED"
                last_alert_clear_time = current_time + 3

        # --- DRAWING PHASE (EVERY RUNNING FRAME) ---
        for i, (x1, y1, x2, y2) in enumerate(last_persons):
            if i < len(last_persons_labels):
                label, color = last_persons_labels[i]
            else:
                label, color = "Person", (0, 255, 0)
            cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(display_frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            
        if time.time() < last_alert_clear_time:
            cv2.putText(display_frame, last_alert_text, (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)

        # Show Output feed locally
        cv2.imshow(f"SafeWoman AI Core - {CAMERA_NAME}", display_frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
