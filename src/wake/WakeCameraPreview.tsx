import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { WakeCheckEngine } from './contract';

export interface WakeCameraPreviewProps {
  engine: WakeCheckEngine;
  style?: StyleProp<ViewStyle>;
}

export const WakeCameraPreview: React.FC<WakeCameraPreviewProps> = ({ style }) => {
  return (
    <View style={[styles.container, style]} testID="wake-camera-preview-container">
      {/* Native VisionCamera Preview or Fallback Viewfinder */}
      <View style={styles.viewfinderBackdrop} />
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
