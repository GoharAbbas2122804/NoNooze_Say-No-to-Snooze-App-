/**
 * ViewfinderCard — the big rounded camera preview card with:
 * - WakeCameraPreview behind a semi-transparent scrim (token-colored)
 * - Dot-grid mask + face oval cutout
 * - Oval pulses while searching, locks on face found
 * - DotRing surrounds the oval
 * - Fill-light white frame when lighting is dark
 */
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import { radii, typography } from '../../theme/tokens';
import {
  WakeCheckEngine,
  WakeCheckState,
} from '../contract';
import { WakeCameraPreview } from '../WakeCameraPreview';
import { DotRing } from './DotRing';

const CARD_HEIGHT = 340;
const OVAL_W = 160;
const OVAL_H = 200;

interface ViewfinderCardProps {
  engine: WakeCheckEngine;
  state: WakeCheckState;
  fillLight?: boolean;
}

export function ViewfinderCard({ engine, state, fillLight }: ViewfinderCardProps) {
  const { colors } = useTheme();
  const faceFound = state.signals?.faceFound ?? false;
  const isSearching = state.phase === 'searching' || (state.phase === 'verifying' && !faceFound);
  const holdProgress = state.phase === 'verifying' || state.phase === 'challenge' || state.phase === 'success'
    ? state.checks.eyesOpen.heldMs / state.checks.eyesOpen.targetMs
    : 0;

  // Oval pulse while searching
  const ovalScale = useSharedValue(1);
  React.useEffect(() => {
    if (isSearching) {
      ovalScale.value = withRepeat(
        withTiming(1.05, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
    } else {
      ovalScale.value = withSpring(1.0, { damping: 15, stiffness: 150 });
    }
  }, [isSearching, ovalScale]);

  // Scrim brightens slightly on face found
  const scrimOpacity = useSharedValue(0.35);
  React.useEffect(() => {
    scrimOpacity.value = withTiming(faceFound ? 0.25 : 0.35, { duration: 400 });
  }, [faceFound, scrimOpacity]);

  const ovalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ovalScale.value }],
  }));
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: scrimOpacity.value,
  }));

  const borderColor = fillLight && state.checks.lighting.level === 'dark'
    ? '#FFFFFF'
    : colors.surface;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceAlt,
          borderColor,
          borderWidth: fillLight && state.checks.lighting.level === 'dark' ? 3 : 1.5,
        },
      ]}
      testID="viewfinder-card"
    >
      {/* Camera preview */}
      <WakeCameraPreview engine={engine} style={StyleSheet.absoluteFill} />

      {/* Token-colored scrim overlay */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.scrim,
          { backgroundColor: colors.background },
          scrimStyle,
        ]}
        pointerEvents="none"
      />

      <View
        testID="live-detection-status"
        accessibilityLabel={faceFound ? `Face detected. Eyes ${state.signals?.eyesOpen !== undefined && state.signals.eyesOpen >= 0.55 ? 'open' : 'closed'}.` : 'Searching for face.'}
        style={[styles.detectionBadge, { backgroundColor: colors.surface }]}
        pointerEvents="none"
      >
        <Text style={[styles.detectionTitle, { color: faceFound ? colors.accentYellow : colors.muted }]}>
          {faceFound ? 'FACE DETECTED' : 'SEARCHING FOR FACE'}
        </Text>
        {faceFound && state.signals && (
          <Text testID="live-eye-prediction" style={[styles.detectionDetail, { color: colors.ink }]}>
            EYES {state.signals.eyesOpen >= 0.55 ? 'OPEN' : 'CLOSED'} · {Math.round(state.signals.eyesOpen * 100)}%
          </Text>
        )}
        {faceFound && state.signals && (
          <Text style={[styles.modelDetail, { color: colors.muted }]}>
            ML {Math.round((state.signals.source.mlkit ?? 0) * 100)}% · CNN {Math.round((state.signals.source.cnn ?? 0) * 100)}%
          </Text>
        )}
      </View>

      {/* Dot ring around the face oval */}
      <View style={styles.ringContainer} pointerEvents="none">
        <DotRing
          holdProgress={Math.min(holdProgress, 1)}
          accessibilityLabel={`Hold progress ${Math.round(holdProgress * 100)} percent`}
        />
      </View>

      {/* Face oval */}
      <Animated.View
        style={[
          styles.oval,
          {
            borderColor: faceFound ? colors.accentYellow : colors.muted,
            borderWidth: faceFound ? 2.5 : 1.5,
          },
          ovalStyle,
        ]}
        pointerEvents="none"
        accessibilityElementsHidden
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: radii.card,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  scrim: {
    borderRadius: radii.card,
  },
  ringContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oval: {
    position: 'absolute',
    width: OVAL_W,
    height: OVAL_H,
    borderRadius: OVAL_W / 2,
  },
  detectionBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    minWidth: 140,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  detectionTitle: {
    fontSize: typography.sizes.micro,
    fontFamily: typography.fonts.bold,
    letterSpacing: 0.8,
  },
  detectionDetail: {
    marginTop: 3,
    fontSize: typography.sizes.caption,
    fontFamily: typography.fonts.bold,
  },
  modelDetail: {
    marginTop: 2,
    fontSize: typography.sizes.micro,
    fontFamily: typography.fonts.medium,
  },
});
