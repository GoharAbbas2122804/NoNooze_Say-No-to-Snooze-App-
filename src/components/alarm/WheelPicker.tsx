import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollView,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronUp, ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { typography, radii } from '../../theme/tokens';

export interface WheelArcResult {
  xOffset: number;
  scale: number;
  opacity: number;
  rotateX: string;
}

/**
 * Pure math helper: computes horizontal arc offset, scale, opacity, and 3D rotation
 * based on the item distance from the selected center row.
 */
export function calculateWheelArcOffset(
  deltaIndex: number,
  isLeftColumn = true,
  curvature = 4.5
): WheelArcResult {
  const absDelta = Math.abs(deltaIndex);
  const direction = isLeftColumn ? -1 : 1;
  const rawOffset = direction * Math.min(28, deltaIndex * deltaIndex * curvature * 0.4);
  const xOffset = rawOffset === 0 ? 0 : rawOffset;
  const scale = Math.max(0.65, 1 - absDelta * 0.14);
  const opacity = Math.max(0.18, 1 - absDelta * 0.28);
  const rotateX = `${Math.max(-60, Math.min(60, deltaIndex * -22))}deg`;

  return { xOffset, scale, opacity, rotateX };
}

export interface WheelPickerColumnProps {
  items: string[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  isLeftColumn?: boolean;
  itemHeight?: number;
  visibleCount?: number;
  testID?: string;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

const DEFAULT_ITEM_HEIGHT = 64;
const VISIBLE_ITEMS = 5;

export function WheelPickerColumn({
  items,
  selectedIndex,
  onSelectIndex,
  isLeftColumn = true,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  visibleCount = VISIBLE_ITEMS,
  testID,
  onInteractionStart,
  onInteractionEnd,
}: WheelPickerColumnProps) {
  const { colors } = useTheme();
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [localIndex, setLocalIndex] = useState(
    Math.max(0, Math.min(selectedIndex, items.length - 1))
  );

  const isUserInteracting = useRef(false);
  const lastHapticIndex = useRef(selectedIndex);
  const padCount = Math.floor(visibleCount / 2);

  // Sync from parent when not dragging
  useEffect(() => {
    if (!isUserInteracting.current && selectedIndex >= 0 && selectedIndex < items.length) {
      setLocalIndex(selectedIndex);
      lastHapticIndex.current = selectedIndex;
      scrollRef.current?.scrollTo({
        y: selectedIndex * itemHeight,
        animated: false,
      });
    }
  }, [selectedIndex, itemHeight, items.length]);

  // Live scroll handler: updates visual 3D position and plays tactile clock tick
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / itemHeight);
      const clamped = Math.max(0, Math.min(index, items.length - 1));

      if (clamped !== lastHapticIndex.current) {
        lastHapticIndex.current = clamped;
        setLocalIndex(clamped);
        Haptics.selectionAsync().catch(() => {});
      }
    },
    [itemHeight, items.length]
  );

  // Commit selection to parent when scroll settles
  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      isUserInteracting.current = false;
      onInteractionEnd?.();

      const offsetY = e.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / itemHeight);
      const clamped = Math.max(0, Math.min(index, items.length - 1));

      setLocalIndex(clamped);
      lastHapticIndex.current = clamped;
      onSelectIndex(clamped);
    },
    [itemHeight, items.length, onInteractionEnd, onSelectIndex]
  );

  // Tap an item directly to jump to it
  const handleItemPress = useCallback(
    (index: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setLocalIndex(index);
      lastHapticIndex.current = index;
      onSelectIndex(index);
      scrollRef.current?.scrollTo({
        y: index * itemHeight,
        animated: true,
      });
    },
    [itemHeight, onSelectIndex]
  );

  // Step up (nudge previous)
  const handleNudgeUp = useCallback(() => {
    const next = Math.max(0, localIndex - 1);
    handleItemPress(next);
  }, [localIndex, handleItemPress]);

  // Step down (nudge next)
  const handleNudgeDown = useCallback(() => {
    const next = Math.min(items.length - 1, localIndex + 1);
    handleItemPress(next);
  }, [items.length, localIndex, handleItemPress]);

  const height = visibleCount * itemHeight;

  return (
    <View
      testID={testID}
      style={[
        styles.columnContainer,
        {
          height,
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      {/* Center lens selection overlay (behind text, pointerEvents="none") */}
      <View
        pointerEvents="none"
        style={[
          styles.selectionLens,
          {
            top: padCount * itemHeight,
            height: itemHeight,
            borderColor: colors.accentYellow,
            backgroundColor: 'rgba(242, 230, 58, 0.08)',
          },
        ]}
      />

      {/* Top subtle nudge trigger */}
      <Pressable
        onPress={handleNudgeUp}
        accessibilityRole="button"
        accessibilityLabel="Previous value"
        style={[styles.nudgeButton, styles.nudgeTop]}
      >
        <ChevronUp size={16} color={colors.muted} />
      </Pressable>

      {/* Scrollable Tumbler ScrollView (Never virtualized, 100% nested scroll safe) */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        decelerationRate="fast"
        snapToInterval={itemHeight}
        snapToAlignment="center"
        onScrollBeginDrag={() => {
          isUserInteracting.current = true;
          onInteractionStart?.();
        }}
        onScrollEndDrag={(e) => {
          // If velocity is 0 (released without momentum), settle immediately
          if (Math.abs(e.nativeEvent.velocity?.y || 0) < 0.1) {
            handleScrollEnd(e);
          }
        }}
        onMomentumScrollBegin={() => {
          isUserInteracting.current = true;
        }}
        onMomentumScrollEnd={handleScrollEnd}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={{ height: padCount * itemHeight }} pointerEvents="none" />
        {items.map((item, index) => {
          const delta = index - localIndex;
          const { xOffset, scale, opacity, rotateX } = calculateWheelArcOffset(
            delta,
            isLeftColumn
          );
          const isSelected = index === localIndex;

          return (
            <Pressable
              key={index}
              onPress={() => handleItemPress(index)}
              accessibilityRole="button"
              accessibilityLabel={`${item}, ${isSelected ? 'selected' : 'option'}`}
              style={[
                styles.itemRow,
                {
                  height: itemHeight,
                  transform: [
                    { translateX: xOffset },
                    { scale },
                    { perspective: 800 },
                    { rotateX },
                  ],
                  opacity,
                },
              ]}
            >
              <Text
                style={[
                  styles.itemText,
                  {
                    color: isSelected ? colors.ink : colors.muted,
                    fontFamily: isSelected
                      ? typography.fonts.bold
                      : typography.fonts.light,
                  },
                ]}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
        <View style={{ height: padCount * itemHeight }} pointerEvents="none" />
      </ScrollView>

      {/* Bottom subtle nudge trigger */}
      <Pressable
        onPress={handleNudgeDown}
        accessibilityRole="button"
        accessibilityLabel="Next value"
        style={[styles.nudgeButton, styles.nudgeBottom]}
      >
        <ChevronDown size={16} color={colors.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  columnContainer: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: radii.card,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  selectionLens: {
    position: 'absolute',
    left: 6,
    right: 6,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    zIndex: 0,
    borderRadius: 10,
  },
  itemRow: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  itemText: {
    fontSize: 42,
    letterSpacing: -1,
  },
  nudgeButton: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  nudgeTop: {
    top: 2,
  },
  nudgeBottom: {
    bottom: 2,
  },
});
