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
  label?: string;
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
  label,
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

  // Sync scroll position when parent changes selectedIndex externally
  useEffect(() => {
    if (!isUserInteracting.current && selectedIndex >= 0 && selectedIndex < items.length) {
      setLocalIndex(selectedIndex);
      lastHapticIndex.current = selectedIndex;
      scrollRef.current?.scrollTo({
        y: selectedIndex * itemHeight,
        animated: true,
      });
    }
  }, [selectedIndex, itemHeight, items.length]);

  // Initial layout positioning to ensure correct offset on Android & iOS
  const handleLayout = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < items.length) {
      scrollRef.current?.scrollTo({
        y: selectedIndex * itemHeight,
        animated: false,
      });
    }
  }, [selectedIndex, itemHeight, items.length]);

  // Lightweight live scroll handler: fires clock tick haptic and live updates active index
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / itemHeight);
      const clamped = Math.max(0, Math.min(index, items.length - 1));

      if (clamped !== lastHapticIndex.current) {
        lastHapticIndex.current = clamped;
        setLocalIndex(clamped);
        onSelectIndex(clamped);
        Haptics.selectionAsync().catch(() => {});
      }
    },
    [itemHeight, items.length, onSelectIndex]
  );

  // Settle & commit selection on momentum stop
  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / itemHeight);
      const clamped = Math.max(0, Math.min(index, items.length - 1));

      setLocalIndex(clamped);
      lastHapticIndex.current = clamped;
      onSelectIndex(clamped);

      // Snap precisely to the slot if not already resting cleanly on it
      const isCloseToSnap = Math.abs(offsetY - clamped * itemHeight) < 1;
      if (!isCloseToSnap) {
        scrollRef.current?.scrollTo({
          y: clamped * itemHeight,
          animated: true,
        });
      }

      isUserInteracting.current = false;
      onInteractionEnd?.();
    },
    [itemHeight, items.length, onInteractionEnd, onSelectIndex]
  );

  // Tap an individual number directly
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
      onInteractionEnd?.();
    },
    [itemHeight, onInteractionEnd, onSelectIndex]
  );

  // Nudge step up (-1)
  const handleNudgeUp = useCallback(() => {
    const next = Math.max(0, localIndex - 1);
    handleItemPress(next);
  }, [localIndex, handleItemPress]);

  // Nudge step down (+1)
  const handleNudgeDown = useCallback(() => {
    const next = Math.min(items.length - 1, localIndex + 1);
    handleItemPress(next);
  }, [items.length, localIndex, handleItemPress]);

  const height = visibleCount * itemHeight;

  return (
    <View
      testID={testID}
      onTouchStart={() => {
        isUserInteracting.current = true;
        onInteractionStart?.();
      }}
      onTouchEnd={() => {
        if (!isUserInteracting.current) {
          onInteractionEnd?.();
        }
      }}
      onTouchCancel={() => {
        isUserInteracting.current = false;
        onInteractionEnd?.();
      }}
      style={[
        styles.columnContainer,
        {
          height,
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      {/* Column header label */}
      {label ? (
        <View style={styles.labelContainer} pointerEvents="none">
          <Text style={[styles.columnLabel, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
            {label}
          </Text>
        </View>
      ) : null}

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

      {/* Native Scrollable Tumbler (Non-virtualized, zero nesting conflicts) */}
      <ScrollView
        ref={scrollRef}
        contentOffset={{ x: 0, y: Math.max(0, selectedIndex * itemHeight) }}
        onLayout={handleLayout}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        decelerationRate="fast"
        snapToInterval={itemHeight}
        snapToAlignment="start"
        onScrollBeginDrag={() => {
          isUserInteracting.current = true;
          onInteractionStart?.();
        }}
        onScrollEndDrag={(e) => {
          if (Math.abs(e.nativeEvent.velocity?.y || 0) < 0.1) {
            handleScrollEnd(e);
          }
        }}
        onMomentumScrollBegin={() => {
          isUserInteracting.current = true;
          onInteractionStart?.();
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
    marginHorizontal: 6,
    borderRadius: radii.card,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  labelContainer: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 3,
  },
  columnLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    opacity: 0.6,
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
    fontSize: 40,
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
    top: 14,
  },
  nudgeBottom: {
    bottom: 4,
  },
});
