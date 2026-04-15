import cv2

class GestureDetector:
    def __init__(self):
        self.enabled = False
        try:
            import mediapipe as mp
            self.mp_hands = mp.solutions.hands
            self.hands = self.mp_hands.Hands(
                static_image_mode=False,
                max_num_hands=2,
                min_detection_confidence=0.7,
                min_tracking_confidence=0.7
            )
            self.mp_draw = mp.solutions.drawing_utils
            self.enabled = True
        except Exception as e:
            print(f"⚠️ Warning: MediaPipe Gesture Detection disabled due to load error: {e}")

    def detect_sos(self, frame):
        """
        Detects raised hand or distress gestures.
        Returns: (is_sos_detected, annotated_frame)
        """
        if not self.enabled:
            return False, frame
            
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = self.hands.process(frame_rgb)
        
        is_sos = False
        if result.multi_hand_landmarks:
            for hand_landmarks in result.multi_hand_landmarks:
                self.mp_draw.draw_landmarks(frame, hand_landmarks, self.mp_hands.HAND_CONNECTIONS)
                
                # Basic SOS check: All fingers open (High y-distance from wrist)
                wrist_y = hand_landmarks.landmark[0].y
                fingertip_y = hand_landmarks.landmark[12].y
                
                if wrist_y - fingertip_y > 0.3:
                    is_sos = True

        return is_sos, frame
