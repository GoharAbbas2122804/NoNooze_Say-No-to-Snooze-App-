import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Step } from '../../domain/types';
import { LiveWakeCheck } from '../../wake/screens/LiveWakeCheck';
import { WakeCheckEngine } from '../../wake/contract';
import { DefaultWakeCheckEngine } from '../../wake/engine';

export interface FaceChallengeProps {
  step: Step;
  onProgress: () => void;
  onComplete: () => void;
  engine?: WakeCheckEngine;
  onFallbackMath?: () => void;
}

export const FaceChallenge: React.FC<FaceChallengeProps> = ({
  step,
  onProgress,
  onComplete,
  engine: customEngine,
  onFallbackMath,
}) => {
  const holdSeconds = Math.max(5, typeof step.target === 'number' ? step.target : 5);
  const [engine] = useState(() => customEngine || new DefaultWakeCheckEngine());

  return (
    <View style={styles.container} testID="face-challenge-container">
      <LiveWakeCheck
        engine={engine}
        targetHoldSeconds={holdSeconds}
        livenessEnabled={true}
        onProgress={onProgress}
        onComplete={onComplete}
        onFallbackMath={onFallbackMath}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
  },
});
