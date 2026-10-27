import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Step, MethodId } from '../../domain/types';
import { DISMISSAL_METHODS } from '../../domain/dismissal-registry';
import { colors, spacing, radii, typography, shadows } from '../../theme/tokens';
import * as Haptics from 'expo-haptics';

interface StepBuilderProps {
  steps: Step[];
  onChange: (steps: Step[]) => void;
}

export const StepBuilder: React.FC<StepBuilderProps> = ({ steps, onChange }) => {
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onChange(steps.filter((_, i) => i !== index));
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
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Dismissal Steps</Text>
        <Text style={styles.stepCount}>
          {steps.length} {steps.length === 1 ? 'step' : 'steps'}
        </Text>
      </View>

      {/* Step Cards List */}
      <View style={styles.stepList}>
        {steps.map((step, index) => {
          const def = DISMISSAL_METHODS[step.methodId];
          return (
            <View key={`step-${index}`} style={styles.stepCard} testID={`step-card-${index}`}>
              <View style={styles.stepCardHeader}>
                <View style={styles.stepIndexPill}>
                  <Text style={styles.stepIndexText}>{index + 1}</Text>
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepTitle}>{def.title}</Text>
                  <Text style={styles.stepDesc}>
                    {step.target} {def.unit}
                  </Text>
                </View>

                {/* Move buttons */}
                <View style={styles.moveButtons}>
                  {index > 0 && (
                    <TouchableOpacity
                      testID={`move-up-${index}`}
                      onPress={() => handleMoveStep(index, 'up')}
                      style={styles.iconButton}
                    >
                      <Text style={styles.iconText}>↑</Text>
                    </TouchableOpacity>
                  )}
                  {index < steps.length - 1 && (
                    <TouchableOpacity
                      testID={`move-down-${index}`}
                      onPress={() => handleMoveStep(index, 'down')}
                      style={styles.iconButton}
                    >
                      <Text style={styles.iconText}>↓</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Delete button (if more than 1 step) */}
                {steps.length > 1 && (
                  <TouchableOpacity
                    testID={`remove-step-${index}`}
                    onPress={() => handleRemoveStep(index)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Stepper Controls */}
              <View style={styles.stepperRow}>
                <Text style={styles.stepperLabel}>Target Reps / Problems:</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    testID={`step-dec-${index}`}
                    style={[styles.stepBtn, step.target <= def.minTarget && styles.stepBtnDisabled]}
                    onPress={() => handleUpdateTarget(index, -1)}
                    disabled={step.target <= def.minTarget}
                  >
                    <Text style={styles.stepBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.targetNumber} testID={`target-value-${index}`}>
                    {step.target}
                  </Text>
                  <TouchableOpacity
                    testID={`step-inc-${index}`}
                    style={[styles.stepBtn, step.target >= def.maxTarget && styles.stepBtnDisabled]}
                    onPress={() => handleUpdateTarget(index, 1)}
                    disabled={step.target >= def.maxTarget}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Add Step Button */}
      <TouchableOpacity
        testID="add-step-button"
        style={styles.addStepButton}
        onPress={() => setPickerVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.addStepText}>+ Add Dismissal Step</Text>
      </TouchableOpacity>

      {/* Method Picker Modal */}
      <Modal visible={pickerVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose Challenge</Text>
            <Text style={styles.modalSubtitle}>
              Select a challenge to add to your wake-up sequence
            </Text>

            <View style={styles.methodGrid}>
              {(Object.keys(DISMISSAL_METHODS) as MethodId[]).map((methodId) => {
                const def = DISMISSAL_METHODS[methodId];
                return (
                  <TouchableOpacity
                    key={methodId}
                    testID={`method-option-${methodId}`}
                    style={[
                      styles.methodCard,
                      !def.available && styles.methodCardDisabled,
                    ]}
                    onPress={() => handleAddMethod(methodId)}
                    disabled={!def.available}
                    activeOpacity={0.7}
                  >
                    <View style={styles.methodHeader}>
                      <Text
                        style={[
                          styles.methodName,
                          !def.available && styles.methodNameDisabled,
                        ]}
                      >
                        {def.title}
                      </Text>
                      {!def.available && (
                        <View style={styles.comingSoonBadge}>
                          <Text style={styles.comingSoonText}>Coming Soon</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.methodDescription}>{def.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              testID="close-picker-button"
              style={styles.closeModalButton}
              onPress={() => setPickerVisible(false)}
            >
              <Text style={styles.closeModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: spacing.base,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.bodyLarge,
    fontWeight: typography.weights.bold,
  },
  stepCount: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
  },
  stepList: {
    gap: spacing.md,
  },
  stepCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    gap: spacing.md,
  },
  stepCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepIndexPill: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndexText: {
    color: colors.textInverse,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
  },
  stepDesc: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
  },
  moveButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.body,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: colors.error,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.sm,
  },
  stepperLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnDisabled: {
    opacity: 0.3,
  },
  stepBtnText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
  },
  targetNumber: {
    color: colors.primary,
    fontSize: typography.sizes.bodyLarge,
    fontWeight: typography.weights.bold,
    minWidth: 32,
    textAlign: 'center',
  },
  addStepButton: {
    height: 48,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryGlow,
  },
  addStepText: {
    color: colors.primary,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    gap: spacing.base,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold,
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
  },
  methodGrid: {
    gap: spacing.md,
  },
  methodCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodCardDisabled: {
    opacity: 0.45,
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  methodName: {
    color: colors.textPrimary,
    fontSize: typography.sizes.bodyLarge,
    fontWeight: typography.weights.semibold,
  },
  methodNameDisabled: {
    color: colors.textMuted,
  },
  comingSoonBadge: {
    backgroundColor: colors.surfaceActive,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  comingSoonText: {
    color: colors.accent,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
  },
  methodDescription: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
  },
  closeModalButton: {
    height: 48,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  closeModalText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
  },
});
