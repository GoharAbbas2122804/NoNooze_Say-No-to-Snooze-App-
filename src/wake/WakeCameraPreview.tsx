import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, AppState, AppStateStatus } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useFrameOutput } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-worklets';
import { useSharedValue } from 'react-native-reanimated';
import { FrameSignals, WakeCheckEngine, WakeCheckState } from './contract';
import { WakeVision } from '../../modules/wake-vision';
import { createLiveFrameSignals, downsampleRgbToGray, encodeGrayFrame } from './liveSignals';

export interface WakeCameraPreviewProps {
  engine: WakeCheckEngine;
  style?: StyleProp<ViewStyle>;
  onFrame?: (signals: FrameSignals) => void;
}

export const WakeCameraPreview: React.FC<WakeCameraPreviewProps> = ({ engine, style, onFrame }) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const frontDevice = useCameraDevice('front');
  const [isActive, setIsActive] = useState<boolean>(true);
  const lastProcessedTimestamp = useSharedValue(0);

  const reportError = useCallback((reason: WakeCheckState['failureReason']) => {
    const report = (engine as WakeCheckEngine & { reportError?: (value: WakeCheckState['failureReason']) => void }).reportError;
    report?.(reason);
  }, [engine]);

  const dispatchFrame = useCallback(async (gray: Uint8Array, width: number, height: number, orientation: string) => {
    try {
      if (!WakeVision.isAvailable()) throw new Error('Wake vision models are unavailable');
      const encoded = encodeGrayFrame(gray);
      const analysis = await WakeVision.analyzeGrayFrame(encoded, width, height, orientation);
      const signals = createLiveFrameSignals(analysis, Date.now());
      const feedFrame = (engine as WakeCheckEngine & { feedFrame?: (value: FrameSignals) => void }).feedFrame;
      feedFrame?.(signals);
      onFrame?.(signals);
    } catch (error) {
      console.warn('Wake vision frame analysis failed:', error);
      reportError('model-error');
    }
  }, [engine, onFrame, reportError]);

  const onFrameError = useCallback(() => reportError('model-error'), [reportError]);

  const frameOutput = useFrameOutput({
    targetResolution: { width: 320, height: 240 },
    pixelFormat: 'rgb',
    dropFramesWhileBusy: true,
    onFrame(frame) {
      'worklet';
      try {
        // The VisionCamera timestamp is in nanoseconds. Analyze at 5 fps to
        // keep inference responsive without copying every preview frame.
        if (frame.timestamp - lastProcessedTimestamp.value < 200_000_000) return;
        lastProcessedTimestamp.value = frame.timestamp;
        const bytesPerPixel = frame.pixelFormat === 'rgb-rgb-8-bit' ? 3 : 4;
        const source = new Uint8Array(frame.getPixelBuffer());
        const gray = downsampleRgbToGray(source, frame.width, frame.height, frame.bytesPerRow, bytesPerPixel);
        runOnJS(dispatchFrame)(gray.pixels, gray.width, gray.height, frame.orientation);
      } catch {
        runOnJS(onFrameError)();
      } finally {
        frame.dispose();
      }
    },
  });

  // AppState management: release camera when backgrounded
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      const active = nextAppState === 'active';
      setIsActive(active);
      if (!active) {
        lastProcessedTimestamp.value = 0;
      }
    });

    return () => {
      subscription.remove();
      setIsActive(false);
    };
  }, [lastProcessedTimestamp]);

  // Permission handling
  useEffect(() => {
    async function checkPermission() {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          reportError('permission-denied');
        }
      }
    }
    checkPermission();
  }, [hasPermission, requestPermission, reportError]);

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
        isActive={isActive && hasPermission}
        outputs={[frameOutput]}
        onError={(error) => {
          console.warn('VisionCamera error:', error);
          reportError('camera-error');
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
