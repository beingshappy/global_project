import cv2
import numpy as np

class GestureDetector:
    """
    OpenCV-based SOS Gesture Detector.
    Uses skin-color segmentation — no mediapipe dependency required.
    Detects raised hand by finding large skin-colored regions in upper frame.
    """
    def __init__(self):
        self.enabled = True
        print("✅ Gesture Detector initialized (OpenCV skin-detection mode)")

    def _get_skin_mask(self, frame):
        """Segment skin pixels using YCrCb color space — robust under varied lighting."""
        ycrcb = cv2.cvtColor(frame, cv2.COLOR_BGR2YCrCb)
        # Widened range to be more inclusive of different lighting/skin tones
        lower = np.array([0, 130, 70], dtype=np.uint8)
        upper = np.array([255, 175, 130], dtype=np.uint8)
        mask = cv2.inRange(ycrcb, lower, upper)
        # Clean up noise
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN,  kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        return mask

    def detect_sos(self, frame):
        """
        Detects a raised hand (SOS gesture).
        Logic: A large skin-colored blob exists in the TOP 40% of the frame.
        Returns: (is_sos_detected, annotated_frame)
        """
        if not self.enabled:
            return False, frame

        h, w = frame.shape[:2]
        # Top 33% is the sweet spot: catches hands above shoulders but usually misses faces
        top_region = frame[:int(h * 0.33), :]

        mask = self._get_skin_mask(top_region)
        skin_pixels = cv2.countNonZero(mask)
        total_pixels = top_region.shape[0] * top_region.shape[1]

        # SOS if skin covers >3% of the top region
        skin_ratio = skin_pixels / total_pixels if total_pixels > 0 else 0
        is_sos = skin_ratio > 0.03

        if is_sos:
            # Draw a simple indicator on original frame
            cv2.putText(frame, "SOS HAND DETECTED", (10, h - 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)

        return is_sos, frame
