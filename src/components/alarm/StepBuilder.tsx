import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { Step, MethodId } from '../../domain/types';
import { DISMISSAL_METHODS } from '../../domain/dismissal-registry';
import { useTheme } from '../../theme/ThemeProvider';
import { RoundButton } from '../ui/RoundButton';
import { notify } from '../../ui/notify';
import { typography, spacing, radii } from '../../theme/tokens';
import { Plus, Minus, X, Lock, ChevronUp, ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlinkingEyesMiniIllustration } from './BlinkingEyesMiniIllustration';

interface StepBuilderProps {
  steps: Step[];
  onChange: (steps: Step[]) => void;
}

export const StepBuilder: React.FC<StepBuilderProps> = ({
  steps,
  onChange,
}) => {
  const { colors } = useTheme();
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleUpdateTarget = (index: number, delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    const step = steps[index];
    const def = DISMISSAL_METHODS[step.methodId];
    const newTarget = Math.max(
      def.minTarget,
      Math.min(def.maxTarget, step.target + delta)
    );

    const updated = steps.map((s, i) =>
      i === index ? { ...s, target: newTarget } : s
    );
    onChange(updated);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) return;
    const removedStep = steps[index];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onChange(steps.filter((_, i) => i !== index));

    notify.action('Challenge step removed', {
      label: 'Undo',
      onPress: () => {
        const restored = [...steps];
        restored.splice(index, 0, removedStep);
        onChange(restored);
      },
    });
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;

    Haptics.selectionAsync().catch(() => {});
    const updated = [...steps];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    onChange(updated);
  };

  const handleAddMethod = (methodId: MethodId) => {
    const def = DISMISSAL_METHODS[methodId];
    if (!def.available) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onChange([...steps, { methodId, target: def.defaultTarget }]);
    setPickerVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.sequenceHeader}>
        <View style={styles.sequenceCopy}>
          <Text style={[styles.sequenceTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>Dismissal sequence</Text>
          <Text style={[styles.sequenceSubtitle, { color: colors.muted, fontFamily: typography.fonts.medium }]}>Complete every step, in order, to turn off the alarm.</Text>
        </View>
        <View style={[styles.sequenceCount, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={[styles.sequenceCountText, { color: colors.accentYellow, fontFamily: typography.fonts.bold }]}>{steps.length}</Text>
        </View>
      </View>

      <View style={styles.sequenceList}>
        {steps.map((step, index) => {
          const def = DISMISSAL_METHODS[step.methodId];
          return (
            <View
              key={`step-${index}`}
              testID={`step-card-${index}`}
              style={[styles.carouselCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
            >
              {/* Header inside Card */}
              <View style={styles.cardHeader}>
                <View style={[styles.indexBadge, { backgroundColor: colors.accentYellow }]}>
                  <Text style={[styles.indexText, { color: '#0D0D0D', fontFamily: typography.fonts.bold }]}>
                    #{index + 1}
                  </Text>
                </View>

                {/* Move & Remove Controls */}
                <View style={styles.controlsRow}>
                  {index > 0 ? (
                    <Pressable
                      testID={`move-up-${index}`}
                      onPress={() => handleMoveStep(index, 'up')}
                      style={styles.microButton}
                    >
                      <ChevronUp size={16} color={colors.ink} />
                    </Pressable>
                  ) : null}
                  {index < steps.length - 1 ? (
                    <Pressable
                      testID={`move-down-${index}`}
                      onPress={() => handleMoveStep(index, 'down')}
                      style={styles.microButton}
                    >
                      <ChevronDown size={16} color={colors.ink} />
                    </Pressable>
                  ) : null}
                  {steps.length > 1 ? (
                    <Pressable
                      testID={`remove-step-${index}`}
                      onPress={() => handleRemoveStep(index)}
                      style={[styles.microButton, { backgroundColor: 'rgba(229, 55, 43, 0.12)' }]}
                    >
                      <X size={14} color={colors.error} />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {/* Title & Description */}
              <Text style={[styles.stepTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
                {def.title}
              </Text>
              <Text style={[styles.stepDesc, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
                {def.description}
              </Text>

              {/* 10x10 Dot Matrix Visual or Blinking Eyes Mini Illustration */}
              <View style={styles.dotMatrixPreview}>
                {step.methodId === 'face' ? (
                  <BlinkingEyesMiniIllustration />
                ) : (
                  Array.from({ length: 40 }).map((_, dotIdx) => (
                    <View
                      key={dotIdx}
                      style={[
                        styles.previewDot,
                        {
                          backgroundColor:
                            dotIdx < step.target * 8
                              ? colors.accentYellow
                              : colors.dotInactive,
                        },
                      ]}
                    />
                  ))
                )}
              </View>

              {/* Target Counter */}
              <View style={styles.targetRow}>
                <Text style={[styles.targetLabel, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
                  Target {def.unit}:
                </Text>
                <View style={styles.counterGroup}>
                  <RoundButton
                    testID={`step-dec-${index}`}
                    size={36}
                    variant="surfaceAlt"
                    onPress={() => handleUpdateTarget(index, -1)}
                  >
                    <Minus size={14} color={colors.ink} />
                  </RoundButton>
                  <Text
                    testID={`target-value-${index}`}
                    style={[styles.targetValue, { color: colors.ink, fontFamily: typography.fonts.bold }]}
                  >
                    {step.target}
                  </Text>
                  <RoundButton
                    testID={`step-inc-${index}`}
                    size={36}
                    variant="surfaceAlt"
                    onPress={() => handleUpdateTarget(index, 1)}
                  >
                    <Plus size={14} color={colors.ink} />
                  </RoundButton>
                </View>
              </View>
            </View>
          );
        })}

        {/* Add Challenge Step Card */}
        <Pressable
          testID="add-step-button"
          onPress={() => setPickerVisible(true)}
          style={[styles.carouselCard, styles.addCard, { borderColor: colors.borderSubtle }]}
        >
          <View style={[styles.addIconCircle, { backgroundColor: colors.accentYellow }]}>
            <Plus size={28} color="#0D0D0D" strokeWidth={2.5} />
          </View>
          <Text style={[styles.addCardTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
            Add a step
          </Text>
          <Text style={[styles.addCardSub, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
            Choose another challenge
          </Text>
        </Pressable>
      </View>

      {/* Challenge Picker Modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
                Choose Challenge
              </Text>
              <RoundButton
                testID="close-picker-button"
                size={36}
                variant="surfaceAlt"
                onPress={() => setPickerVisible(false)}
              >
                <X size={16} color={colors.ink} />
              </RoundButton>
            </View>

            <ScrollView style={styles.modalScroll}>
              {Object.values(DISMISSAL_METHODS).map((method) => (
                <Pressable
                  key={method.id}
                  testID={`method-option-${method.id}`}
                  onPress={() => handleAddMethod(method.id)}
                  disabled={!method.available}
                  style={[
                    styles.methodOption,
                    {
                      backgroundColor: colors.surfaceAlt,
                      opacity: method.available ? 1 : 0.6,
                    },
                  ]}
                >
                  <View style={styles.methodInfo}>
                    <Text style={[styles.methodTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
                      {method.title}
                    </Text>
                    <Text style={[styles.methodDesc, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
                      {method.description}
                    </Text>
                  </View>
                  {!method.available ? (
                    <View style={[styles.comingSoonBadge, { backgroundColor: colors.surface }]}>
                      <Lock size={12} color={colors.muted} style={{ marginRight: 4 }} />
                      <Text style={[styles.comingSoonText, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
                        Coming Soon
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  sequenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sequenceCopy: { flex: 1, paddingRight: spacing.md },
  sequenceTitle: { fontSize: typography.sizes.h3 },
  sequenceSubtitle: { fontSize: typography.sizes.caption, marginTop: 3 },
  sequenceCount: { minWidth: 34, height: 34, paddingHorizontal: spacing.sm, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  sequenceCountText: { fontSize: typography.sizes.body },
  sequenceList: {
    gap: spacing.sm,
  },
  carouselCard: {
    width: '100%',
    borderRadius: radii.card,
    padding: spacing.base,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  indexBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  indexText: {
    fontSize: typography.sizes.micro,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  microButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
  },
  stepTitle: {
    fontSize: typography.sizes.bodyLarge,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: typography.sizes.caption,
  },
  dotMatrixPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: spacing.md,
    height: 60,
    alignContent: 'center',
  },
  previewDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  targetLabel: {
    fontSize: typography.sizes.bodySmall,
  },
  counterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  targetValue: {
    fontSize: typography.sizes.bodyLarge,
    minWidth: 20,
    textAlign: 'center',
  },
  addCard: {
    minHeight: 72,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    borderStyle: 'dashed',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  addIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  addCardTitle: {
    fontSize: typography.sizes.body,
  },
  addCardSub: {
    fontSize: typography.sizes.caption,
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: spacing.base,
  },
  modalCard: {
    borderRadius: radii.card,
    padding: spacing.base,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  modalTitle: {
    fontSize: typography.sizes.h3,
  },
  modalScroll: {
    maxHeight: 320,
  },
  methodOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: typography.sizes.body,
  },
  methodDesc: {
    fontSize: typography.sizes.caption,
    marginTop: 2,
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    marginLeft: spacing.sm,
  },
  comingSoonText: {
    fontSize: typography.sizes.micro,
  },
});
