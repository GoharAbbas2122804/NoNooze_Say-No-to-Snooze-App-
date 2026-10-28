import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Sparkles,
  Smile,
  Sun,
  Calculator,
  Dumbbell,
  ShieldCheck,
  Plus,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { RoundButton } from '../components/ui/RoundButton';
import { TwoToneTitle } from '../components/ui/TwoToneTitle';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { FaceChallenge } from '../components/challenges/FaceChallenge';
import { EnvironmentChallenge } from '../components/challenges/EnvironmentChallenge';
import { MathChallenge } from '../components/challenges/MathChallenge';
import { PushupsChallenge } from '../components/challenges/PushupsChallenge';
import { MethodId } from '../domain/types';
import { DISMISSAL_METHODS } from '../domain/dismissal-registry';
import { typography, spacing, radii, iconSizes } from '../theme/tokens';
import { notify } from '../ui/notify';
import * as Haptics from 'expo-haptics';

export default function ChallengesTabScreen() {
  const { colors } = useTheme();
  const [selectedMethod, setSelectedMethod] = useState<MethodId>('face');

  const challengesList = [
    {
      id: 'face' as MethodId,
      name: 'Face AI',
      subtitle: 'Facial Expression Check',
      Icon: Smile,
      badge: 'VISION AI',
    },
    {
      id: 'environment' as MethodId,
      name: 'Light AI',
      subtitle: 'Room Lumens Scan',
      Icon: Sun,
      badge: 'SENSOR AI',
    },
    {
      id: 'math' as MethodId,
      name: 'Math',
      subtitle: 'Cognitive Puzzle',
      Icon: Calculator,
      badge: 'COGNITIVE',
    },
    {
      id: 'pushups' as MethodId,
      name: 'Movement',
      subtitle: 'Motion Reps Tracking',
      Icon: Dumbbell,
      badge: 'PHYSICAL',
    },
  ];

  const handleSelectTab = (methodId: MethodId) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedMethod(methodId);
  };

  const handleCreateAlarmWithChallenge = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push('/edit');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.topHeader, { borderBottomColor: colors.borderSubtle }]}>
        <RoundButton
          variant="surface"
          size={44}
          onPress={() => router.back()}
          accessibilityLabel="Back to Home"
        >
          <ArrowLeft size={iconSizes.sm} color={colors.ink} />
        </RoundButton>
        <TwoToneTitle primary="AI Challenge" secondary="Hub" />
        <ThemeToggle />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Deep Learning Philosophy Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <View style={styles.heroTopRow}>
            <View style={[styles.heroBadge, { backgroundColor: colors.accentYellow }]}>
              <Sparkles size={12} color="#0D0D0D" />
              <Text style={[styles.heroBadgeText, { color: '#0D0D0D', fontFamily: typography.fonts.bold }]}>
                UNSKIPPABLE WAKEFULNESS
              </Text>
            </View>
            <ShieldCheck size={20} color={colors.accentYellow} />
          </View>

          <Text style={[styles.heroTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
            Zero-Snooze Deep Learning Protocol
          </Text>
          <Text style={[styles.heroDesc, { color: colors.muted, fontFamily: typography.fonts.regular }]}>
            Overcome sleep inertia with real interactive challenges. Practice and test each AI model below before setting your alarm.
          </Text>
        </View>

        {/* Challenge Selection Tabs */}
        <View style={styles.tabBarRow}>
          {challengesList.map(({ id, name, Icon, badge }) => {
            const isSelected = selectedMethod === id;
            return (
              <Pressable
                key={id}
                testID={`challenge-tab-${id}`}
                onPress={() => handleSelectTab(id)}
                style={[
                  styles.tabButton,
                  {
                    backgroundColor: isSelected ? colors.accentYellow : colors.surface,
                    borderColor: isSelected ? colors.accentYellow : colors.borderSubtle,
                  },
                ]}
              >
                <Icon size={16} color={isSelected ? '#0D0D0D' : colors.ink} />
                <Text
                  style={[
                    styles.tabButtonText,
                    {
                      color: isSelected ? '#0D0D0D' : colors.ink,
                      fontFamily: isSelected ? typography.fonts.bold : typography.fonts.medium,
                    },
                  ]}
                >
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Embedded Interactive Challenge Practice Area */}
        <View style={[styles.challengeSurface, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={styles.practiceHeader}>
            <View style={[styles.practiceBadge, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={[styles.practiceBadgeText, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
                INTERACTIVE PRACTICE MODE
              </Text>
            </View>
            <Text style={[styles.methodName, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
              {DISMISSAL_METHODS[selectedMethod]?.title}
            </Text>
          </View>

          {/* Active Component */}
          {selectedMethod === 'face' && (
            <FaceChallenge
              step={{ methodId: 'face', target: 1 }}
              onProgress={() => {}}
              onComplete={() => {
                notify.success('Practice complete! Face AI verified.');
              }}
            />
          )}

          {selectedMethod === 'environment' && (
            <EnvironmentChallenge
              step={{ methodId: 'environment', target: 1 }}
              onProgress={() => {}}
              onComplete={() => {
                notify.success('Practice complete! Room lumens verified.');
              }}
            />
          )}

          {selectedMethod === 'math' && (
            <MathChallenge
              step={{ methodId: 'math', target: 2 }}
              onProgress={() => {}}
              onComplete={() => {
                notify.success('Practice complete! Math puzzle solved.');
              }}
            />
          )}

          {selectedMethod === 'pushups' && (
            <PushupsChallenge
              step={{ methodId: 'pushups', target: 5 }}
              onProgress={() => {}}
              onComplete={() => {
                notify.success('Practice complete! Pushups verified.');
              }}
            />
          )}
        </View>

        {/* Set Alarm with this Challenge CTA */}
        <Pressable
          testID="create-alarm-cta"
          onPress={handleCreateAlarmWithChallenge}
          style={[styles.ctaButton, { backgroundColor: colors.ink }]}
        >
          <Plus size={18} color={colors.background} strokeWidth={2.4} />
          <Text style={[styles.ctaButtonText, { color: colors.background, fontFamily: typography.fonts.bold }]}>
            Create Alarm With This Challenge
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: radii.card,
    padding: spacing.base,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  heroBadgeText: {
    fontSize: typography.sizes.micro,
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: typography.sizes.h3,
    marginVertical: 4,
    letterSpacing: -0.4,
  },
  heroDesc: {
    fontSize: typography.sizes.bodySmall,
    lineHeight: 18,
  },
  tabBarRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 42,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  tabButtonText: {
    fontSize: typography.sizes.caption,
  },
  challengeSurface: {
    borderRadius: radii.card,
    padding: spacing.base,
    borderWidth: 1,
    marginBottom: spacing.base,
  },
  practiceHeader: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  practiceBadge: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 3,
    borderRadius: radii.pill,
    marginBottom: 4,
  },
  practiceBadgeText: {
    fontSize: typography.sizes.micro,
    letterSpacing: 0.6,
  },
  methodName: {
    fontSize: typography.sizes.bodyLarge,
  },
  ctaButton: {
    width: '100%',
    height: 52,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  ctaButtonText: {
    fontSize: typography.sizes.body,
  },
});
