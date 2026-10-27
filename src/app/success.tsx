import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, radii, typography, shadows } from '../theme/tokens';
import { APP_NAME } from '../constants/app';
import * as Haptics from 'expo-haptics';

export default function SuccessScreen() {
  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeEmoji}>☀️</Text>
          </View>

          <Text style={styles.title}>Good Morning!</Text>
          <Text style={styles.subtitle}>
            All challenges completed. You are officially awake.
          </Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryIcon}>✓</Text>
              <Text style={styles.summaryText}>Alarm successfully dismissed</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryIcon}>🧠</Text>
              <Text style={styles.summaryText}>Brain activated with challenges</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryIcon}>⏰</Text>
              <Text style={styles.summaryText}>Next alarms remain on schedule</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          testID="success-done-button"
          style={styles.doneButton}
          onPress={handleDone}
          activeOpacity={0.8}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.base,
    width: '100%',
  },
  badgeContainer: {
    width: 100,
    height: 100,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadows.glowLime,
    marginBottom: spacing.base,
  },
  badgeEmoji: {
    fontSize: 52,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.black,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.body,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    marginTop: spacing.lg,
    ...shadows.card,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  summaryIcon: {
    fontSize: 18,
    color: colors.primary,
  },
  summaryText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.medium,
  },
  doneButton: {
    width: '100%',
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glowLime,
  },
  doneButtonText: {
    color: colors.textInverse,
    fontSize: typography.sizes.bodyLarge,
    fontWeight: typography.weights.bold,
  },
});
