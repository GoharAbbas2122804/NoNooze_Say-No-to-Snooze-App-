import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { typography, spacing } from '../../theme/tokens';

export interface TwoToneTitleProps {
  primary: string;
  secondary?: string;
  accessoryRight?: React.ReactNode;
}

export function TwoToneTitle({ primary, secondary, accessoryRight }: TwoToneTitleProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.textColumn}>
        <Text
          style={[
            styles.primaryText,
            { color: colors.ink, fontFamily: typography.fonts.bold },
          ]}
        >
          {primary}
        </Text>
        {secondary ? (
          <Text
            style={[
              styles.secondaryText,
              { color: colors.muted, fontFamily: typography.fonts.medium },
            ]}
          >
            {secondary}
          </Text>
        ) : null}
      </View>
      {accessoryRight ? <View style={styles.accessory}>{accessoryRight}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  textColumn: {
    flex: 1,
  },
  primaryText: {
    fontSize: typography.sizes.h1,
    letterSpacing: -0.8,
  },
  secondaryText: {
    fontSize: typography.sizes.h2,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  accessory: {
    marginLeft: spacing.base,
  },
});
