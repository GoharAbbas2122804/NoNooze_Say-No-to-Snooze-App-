import React, { useRef, useEffect, useCallback } from 'react';
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
import Animated, { useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, interpolateColor } from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';
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
  'worklet';
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

function AnimatedWheelItem({ item, index, itemHeight, isLeftColumn, scrollOffset, colors, onPress }: {
  item: string; index: number; itemHeight: number; isLeftColumn: boolean;
  scrollOffset: { value: number }; colors: { ink: string; muted: string }; onPress: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const delta = index - scrollOffset.value / itemHeight;
    const arc = calculateWheelArcOffset(delta, isLeftColumn);
    return {
      opacity: arc.opacity,
      transform: [
        { translateX: arc.xOffset },
        { scale: arc.scale },
        { perspective: 800 },
        { rotateX: arc.rotateX },
      ],
    };
  });
  const animatedTextStyle = useAnimatedStyle(() => {
    const distance = Math.min(2, Math.abs(index - scrollOffset.value / itemHeight));
    return { color: interpolateColor(distance, [0, 1, 2], [colors.ink, colors.muted, colors.muted]) };
  });
  const isSelected = Math.round(scrollOffset.value / itemHeight) === index;
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      accessibilityLabel={`${item}, ${isSelected ? 'selected' : 'option'}`}
      style={[styles.itemRow, { height: itemHeight }, animatedStyle as any]}>
      <Animated.Text style={[styles.itemText, animatedTextStyle,
        { fontFamily: isSelected ? typography.fonts.bold : typography.fonts.light }]}>{item}</Animated.Text>
    </Pressable>
  );
}

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
  const scrollOffset = useSharedValue(selectedIndex * itemHeight);
  const activeIndex = useSharedValue(selectedIndex);
  const isUserInteracting = useRef(false);
  const isScrolling = useRef(false);
  const padCount = Math.floor(visibleCount / 2);
  const fireTick = useCallback(() => { Haptics.selectionAsync().catch(() => {}); }, []);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = event.contentOffset.y;
      const index = Math.max(0, Math.min(Math.round(event.contentOffset.y / itemHeight), items.length - 1));
      if (index !== activeIndex.value) {
        activeIndex.value = index;
        runOnJS(fireTick)();
      }
    },
  }, [itemHeight, items.length, fireTick]);

  // Sync scroll position when parent changes selectedIndex externally
  useEffect(() => {
    if (!isUserInteracting.current && selectedIndex >= 0 && selectedIndex < items.length) {
      activeIndex.value = selectedIndex;
      scrollOffset.value = selectedIndex * itemHeight;
      scrollRef.current?.scrollTo({
        y: selectedIndex * itemHeight,
        animated: true,
      });
    }
  }, [selectedIndex, itemHeight, items.length, activeIndex, scrollOffset]);

  // Initial layout positioning to ensure correct offset on Android & iOS
  const handleLayout = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < items.length) {
      scrollRef.current?.scrollTo({
        y: selectedIndex * itemHeight,
        animated: false,
      });
    }
  }, [selectedIndex, itemHeight, items.length]);

  // Settle & commit selection on momentum stop
  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / itemHeight);
      const clamped = Math.max(0, Math.min(index, items.length - 1));

      // Reanimated shared values are intentionally updated from this native event callback.
      // eslint-disable-next-line react-hooks/immutability
      activeIndex.value = clamped;
      // eslint-disable-next-line react-hooks/immutability
      scrollOffset.value = clamped * itemHeight;
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
      isScrolling.current = false;
      onInteractionEnd?.();
    },
    [itemHeight, items.length, onInteractionEnd, onSelectIndex, activeIndex, scrollOffset]
  );

  // Tap an individual number directly
  const handleItemPress = useCallback(
    (index: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      // Reanimated shared values drive the wheel visuals and are intentionally updated on selection.
      // eslint-disable-next-line react-hooks/immutability
      activeIndex.value = index;
      // eslint-disable-next-line react-hooks/immutability
      scrollOffset.value = index * itemHeight;
      onSelectIndex(index);
      scrollRef.current?.scrollTo({
        y: index * itemHeight,
        animated: true,
      });
      onInteractionEnd?.();
    },
    [itemHeight, onInteractionEnd, onSelectIndex, activeIndex, scrollOffset]
  );

  // Nudge step up (-1)
  const handleNudgeUp = useCallback(() => {
    const next = Math.max(0, activeIndex.value - 1);
    handleItemPress(next);
  }, [activeIndex, handleItemPress]);

  // Nudge step down (+1)
  const handleNudgeDown = useCallback(() => {
    const next = Math.min(items.length - 1, activeIndex.value + 1);
    handleItemPress(next);
  }, [items.length, activeIndex, handleItemPress]);

  const height = visibleCount * itemHeight;

  return (
    <View
      testID={testID}
      onTouchStart={() => {
        isUserInteracting.current = true;
        onInteractionStart?.();
      }}
      onTouchEnd={() => {
        if (!isScrolling.current) {
          isUserInteracting.current = false;
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
      <Animated.ScrollView
        ref={scrollRef}
        contentOffset={{ x: 0, y: Math.max(0, selectedIndex * itemHeight) }}
        onLayout={handleLayout}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        decelerationRate="fast"
        snapToInterval={itemHeight}
        snapToAlignment="start"
        disableIntervalMomentum
        onScrollBeginDrag={() => {
          isUserInteracting.current = true;
          isScrolling.current = true;
          onInteractionStart?.();
        }}
        onScrollEndDrag={(e) => {
          if (Math.abs(e.nativeEvent.velocity?.y || 0) < 0.1) {
            handleScrollEnd(e);
          }
        }}
        onMomentumScrollBegin={() => {
          isUserInteracting.current = true;
          isScrolling.current = true;
          onInteractionStart?.();
        }}
        onMomentumScrollEnd={handleScrollEnd}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <View style={{ height: padCount * itemHeight }} pointerEvents="none" />
        {items.map((item, index) => <AnimatedWheelItem key={index} item={item} index={index}
          itemHeight={itemHeight} isLeftColumn={isLeftColumn} scrollOffset={scrollOffset}
          colors={colors} onPress={() => handleItemPress(index)} />)}
        <View style={{ height: padCount * itemHeight }} pointerEvents="none" />
      </Animated.ScrollView>

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
