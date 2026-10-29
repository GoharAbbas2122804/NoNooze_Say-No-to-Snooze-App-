import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Line, Rect, Ellipse, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import { TwoToneTitle } from '../../components/ui/TwoToneTitle';
import { typography, spacing, radii } from '../../theme/tokens';
import * as Haptics from 'expo-haptics';

export interface SetupGuideProps {
  onComplete: () => void;
  onSkip: () => void;
  faceFound?: boolean;
}

export function SetupGuide({ onComplete, onSkip, faceFound = false }: SetupGuideProps) {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      titlePrimary: 'Prop your',
      titleSecondary: 'phone',
      desc: 'Angle your phone on your nightstand facing where your head rests.',
    },
    {
      titlePrimary: 'Keep clear',
      titleSecondary: 'distance',
      desc: 'Keep 30 to 50 cm distance so your eyes and face are fully visible.',
    },
    {
      titlePrimary: 'Look into',
      titleSecondary: 'lens',
      desc: 'Look directly toward the screen to calibrate morning eye openness.',
    },
  ];

  // Looping gentle bob animation
  const bobY = useSharedValue(0);

  useEffect(() => {
    bobY.value = withRepeat(
      withTiming(-6, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [bobY]);

  const animatedIllustrationStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobY.value }],
  }));

  // Auto-advance when face found
  useEffect(() => {
    if (faceFound) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const timer = setTimeout(() => {
        onComplete();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [faceFound, onComplete]);

  const handleNext = () => {
    Haptics.selectionAsync().catch(() => {});
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const step = steps[currentStep];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="setup-guide-view">
      {/* Top Header */}
      <View style={styles.topRow}>
        <TwoToneTitle primary={step.titlePrimary} secondary={step.titleSecondary} />
        <Pressable
          testID="setup-skip-btn"
          onPress={onSkip}
          style={styles.skipButton}
          accessibilityRole="button"
          accessibilityLabel="Skip setup guide"
        >
          <Text style={[styles.skipText, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
            Skip
          </Text>
        </Pressable>
      </View>

      {/* Animated SVG Line Illustration */}
      <Animated.View style={[styles.svgWrapper, animatedIllustrationStyle]}>
        <Svg width="280" height="200" viewBox="0 0 280 200">
          {/* Nightstand flat horizontal surface */}
          <Line
            x1="20"
            y1="170"
            x2="260"
            y2="170"
            stroke={colors.muted}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Phone leaning on nightstand */}
          <Rect
            x="50"
            y="65"
            width="44"
            height="86"
            rx="8"
            stroke={faceFound ? colors.accentYellow : colors.ink}
            strokeWidth="2"
            fill="transparent"
            transform="rotate(-18 72 108)"
          />

          {/* Distance marker dashed line */}
          <Line
            x1="110"
            y1="110"
            x2="170"
            y2="110"
            stroke={colors.accentYellow}
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <SvgText
            x="140"
            y="100"
            fontSize="10"
            fill={colors.muted}
            textAnchor="middle"
            fontFamily="InterTight_500Medium"
          >
            30–50 cm
          </SvgText>

          {/* Face oval */}
          <Ellipse
            cx="210"
            cy="110"
            rx="32"
            ry="44"
            stroke={faceFound ? colors.accentYellow : colors.muted}
            strokeWidth={faceFound ? '2.5' : '1.5'}
            fill="transparent"
          />
          {/* Eyes in oval */}
          <Ellipse
            cx="200"
            cy="104"
            rx="4"
            ry="3"
            fill={faceFound ? colors.accentYellow : colors.muted}
          />
          <Ellipse
            cx="220"
            cy="104"
            rx="4"
            ry="3"
            fill={faceFound ? colors.accentYellow : colors.muted}
          />
        </Svg>
      </Animated.View>

      {/* Description & Step Dots */}
      <View style={styles.contentSection}>
        <Text style={[styles.descText, { color: colors.ink, fontFamily: typography.fonts.regular }]}>
          {step.desc}
        </Text>

        <View style={styles.stepDotsRow}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                {
                  backgroundColor:
                    i === currentStep
                      ? colors.accentYellow
                      : i < currentStep
                      ? colors.ink
                      : colors.dotInactive,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Bottom Action */}
      <View style={styles.bottomSection}>
        <Pressable
          testID="setup-next-btn"
          onPress={handleNext}
          style={[styles.primaryButton, { backgroundColor: colors.accentYellow }]}
          accessibilityRole="button"
          accessibilityLabel={currentStep === steps.length - 1 ? 'Finish setup' : 'Next step'}
        >
          <Text style={[styles.primaryButtonText, { color: '#0D0D0D', fontFamily: typography.fonts.bold }]}>
            {faceFound ? 'Face Detected — Continue' : currentStep === steps.length - 1 ? 'Ready' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  skipButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  skipText: {
    fontSize: typography.sizes.bodySmall,
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xl,
  },
  contentSection: {
    alignItems: 'center',
    gap: spacing.base,
  },
  descText: {
    fontSize: typography.sizes.body,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.base,
  },
  stepDotsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bottomSection: {
    marginBottom: spacing.base,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: typography.sizes.body,
    letterSpacing: 0.2,
  },
});
