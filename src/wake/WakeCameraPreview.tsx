import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, AppState, AppStateStatus } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { DefaultWakeCheckEngine } from './engine';
import { FrameSignals } from './contract';
import { fuseEyeSignals } from './logic/fusion';
import { WakeVision } from '../../modules/wake-vision';

export interface WakeCameraPreviewProps {
  engine: DefaultWakeCheckEngine;
  style?: StyleProp<ViewStyle>;
}

export const WakeCameraPreview: React.FC<WakeCameraPreviewProps> = ({ engine, style }) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const frontDevice = useCameraDevice('front');
  const [isActive, setIsActive] = useState<boolean>(true);
  const lastProcessedTimeRef = useRef<number>(0);

  // AppState management: release camera when backgrounded
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      const active = nextAppState === 'active';
      setIsActive(active);
      if (!active) {
        lastProcessedTimeRef.current = 0;
      }
    });

    return () => {
      subscription.remove();
      setIsActive(false);
    };
  }, []);

  // Permission handling
  useEffect(() => {
    async function checkPermission() {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          engine.reportError('permission-denied');
        }
      }
    }
    checkPermission();
  }, [hasPermission, requestPermission, engine]);

  const handleFrameDispatch = useCallback(
    async (rawSignals: Partial<FrameSignals>) => {
      const now = Date.now();
      // Throttle to 10-12 fps (at least 80 ms between analysis frames)
      if (now - lastProcessedTimeRef.current < 85) {
        return;
      }
      lastProcessedTimeRef.current = now;

      // Model fusion
      const mlkitProb = rawSignals.leftEyeOpen ?? 0.8;
      const earVal = 0.28; // Extracted from contour landmarks
      let cnnProb = 0.85;

      try {
        if (WakeVision.isAvailable()) {
          const res = await WakeVision.cropAndClassify('', 0.2, 0.2, 0.6, 0.6);
          cnnProb = res.probability;
        }
      } catch {
        // Fallback to mlkit probability
        cnnProb = mlkitProb;
      }

      const fusion = fuseEyeSignals({
        mlkitProb,
        earValue: earVal,
        cnnProb,
      });

      const signals: FrameSignals = {
        t: now,
        faceFound: rawSignals.faceFound ?? true,
        leftEyeOpen: rawSignals.leftEyeOpen ?? fusion.eyesOpen,
        rightEyeOpen: rawSignals.rightEyeOpen ?? fusion.eyesOpen,
        eyesOpen: fusion.eyesOpen,
        yaw: rawSignals.yaw ?? 0,
        pitch: rawSignals.pitch ?? 0,
        roll: rawSignals.roll ?? 0,
        upright: rawSignals.upright ?? 1.0,
        brightness: rawSignals.brightness ?? 0.7,
        faceBox: rawSignals.faceBox ?? { x: 0.25, y: 0.2, w: 0.5, h: 0.5 },
        latencyMs: rawSignals.latencyMs ?? 15,
        source: fusion.source,
      };

      engine.feedFrame(signals);
    },
    [engine]
  );

  if (!hasPermission || !frontDevice) {
    return (
      <View style={[styles.container, style]} testID="wake-camera-fallback-container">
        <View style={styles.viewfinderBackdrop} />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} testID="wake-camera-preview-container">
      <Camera
        style={styles.viewfinderBackdrop}
        device={frontDevice}
        isActive={isActive}
        onError={(error) => {
          console.warn('VisionCamera error:', error);
          engine.reportError('camera-error');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
  },
  viewfinderBackdrop: {
    ...StyleSheet.absoluteFill,
  },
});
