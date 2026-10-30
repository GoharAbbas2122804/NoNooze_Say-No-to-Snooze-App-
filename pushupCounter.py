import cv2
import mediapipe as mp
import numpy as np
from utils.angle_calc import calculate_angle

# Initialize Mediapipe pose class and drawing utilities
mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose

# Push-up counter variables
count = 0
stage = None  # "Up" or "Down"

# Start webcam
cap = cv2.VideoCapture(0)

with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
    while cap.isOpened():
        ret, frame = cap.read()

        # Recolor image to RGB
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image.flags.writeable = False

        # Make pose detection
        results = pose.process(image)

        # Recolor back to BGR
        image.flags.writeable = True
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

        try:
            landmarks = results.pose_landmarks.landmark

            # Get coordinates for right arm
            shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x,
                        landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
            elbow = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x,
                     landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y]
            wrist = [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].x,
                     landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].y]

            # Calculate angle
            angle = calculate_angle(shoulder, elbow, wrist)

            # Push-up logic
            if angle > 160:
                stage = "Up"
            if angle < 90 and stage == "Up":
                stage = "Down"
                count += 1

            # Show angle and stage
            cv2.putText(image, f'Angle: {int(angle)}', (50, 100),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 255), 2)
            cv2.putText(image, f'Stage: {stage}', (50, 150),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 0, 255), 2)
        except:
            pass

        # Show count
        cv2.putText(image, f'Push-Ups: {count}', (50, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)

        # Draw landmarks
        mp_drawing.draw_landmarks(
            image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)

        # Display
        cv2.imshow("Push-Up Counter", image)

        # Exit with Q
        if cv2.waitKey(10) & 0xFF == ord('q'):
            break

# Release
cap.release()
cv2.destroyAllWindows()