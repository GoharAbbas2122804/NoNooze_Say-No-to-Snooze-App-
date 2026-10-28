import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  FlatList,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { typography, radii } from '../../theme/tokens';

export interface WheelArcResult {
  xOffset: number;
  scale: number;
  opacity: number;
}

/**
 * Pure math helper: computes horizontal arc offset, scale, and opacity
 * based on the item distance from the selected center row.
 * Numbers curve away from the center like an arc.
 */
export function calculateWheelArcOffset(
  deltaIndex: number,
  isLeftColumn = true,
  curvature = 4.5
): WheelArcResult {
  const absDelta = Math.abs(deltaIndex);
  // Arc pushes outward or curves away from center
  const direction = isLeftColumn ? -1 : 1;
  const rawOffset = direction * Math.min(28, (deltaIndex * deltaIndex) * curvature * 0.4);
  const xOffset = rawOffset === 0 ? 0 : rawOffset;
  const scale = Math.max(0.65, 1 - absDelta * 0.14);
  const opacity = Math.max(0.18, 1 - absDelta * 0.28);

  return { xOffset, scale, opacity };
}

export interface WheelPickerColumnProps {
  items: string[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  isLeftColumn?: boolean;
  itemHeight?: number;
  visibleCount?: number;
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
}: WheelPickerColumnProps) {
  const { colors } = useTheme();
  const listRef = useRef<FlatList>(null);
  const isUserScrolling = useRef(false);
  const lastIndex = useRef(selectedIndex);

  // Pad items on top and bottom so first/last can be centered
  const padCount = Math.floor(visibleCount / 2);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / itemHeight);
      const clampedIndex = Math.max(0, Math.min(index, items.length - 1));

      if (clampedIndex !== lastIndex.current) {
        lastIndex.current = clampedIndex;
        Haptics.selectionAsync().catch(() => {});
        onSelectIndex(clampedIndex);
      }
    },
    [itemHeight, items.length, onSelectIndex]
  );

  useEffect(() => {
    if (!isUserScrolling.current && selectedIndex >= 0) {
      listRef.current?.scrollToOffset({
        offset: selectedIndex * itemHeight,
        animated: true,
      });
      lastIndex.current = selectedIndex;
    }
  }, [selectedIndex, itemHeight]);

  const height = visibleCount * itemHeight;

  return (
    <View
      style={[
        styles.columnContainer,
        {
          height,
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      {/* Center lens selection overlay */}
      <View
        pointerEvents="none"
        style={[
          styles.selectionLens,
          {
            top: padCount * itemHeight,
            height: itemHeight,
            borderColor: colors.borderSubtle,
          },
        ]}
      />

      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(_, index) => String(index)}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        initialScrollIndex={selectedIndex >= 0 ? selectedIndex : 0}
        getItemLayout={(_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
        onScrollBeginDrag={() => {
          isUserScrolling.current = true;
        }}
        onScrollEndDrag={() => {
          isUserScrolling.current = false;
        }}
        onMomentumScrollEnd={() => {
          isUserScrolling.current = false;
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingVertical: padCount * itemHeight,
        }}
        renderItem={({ item, index }) => {
          const delta = index - selectedIndex;
          const { xOffset, scale, opacity } = calculateWheelArcOffset(
            delta,
            isLeftColumn
          );
          const isSelected = index === selectedIndex;

          return (
            <View
              style={[
                styles.itemRow,
                {
                  height: itemHeight,
                  transform: [{ translateX: xOffset }, { scale }],
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
            </View>
          );
        }}
      />
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
    left: 8,
    right: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    zIndex: 1,
  },
  itemRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 38,
    letterSpacing: -1,
  },
});
