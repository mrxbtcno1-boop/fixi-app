import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: any;
}

export function ScreenWrapper({ children, style }: ScreenWrapperProps) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const isTablet = width > 600;

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.background.primary,
          alignItems: isTablet ? 'center' : 'stretch',
        },
        style,
      ]}
    >
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: isTablet ? 500 : '100%',
        }}
      >
        {children}
      </View>
    </View>
  );
}
