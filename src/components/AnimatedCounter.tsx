import React, { useEffect, useRef } from 'react';
import { Text, Animated, TextStyle } from 'react-native';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  style?: TextStyle;
  testID?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  prefix = '',
  suffix = '',
  duration = 800,
  decimals = 0,
  style,
  testID,
}) => {
  const animValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = React.useState('0');

  useEffect(() => {
    animValue.stopAnimation();
    const startFrom = 0;
    animValue.setValue(startFrom);

    Animated.timing(animValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();

    const listener = animValue.addListener(({ value: v }) => {
      const formatted = decimals > 0
        ? v.toFixed(decimals)
        : Math.round(v).toLocaleString('de-DE');
      setDisplayValue(formatted);
    });

    return () => animValue.removeListener(listener);
  }, [value]);

  return (
    <Text style={style} testID={testID}>
      {prefix}{displayValue}{suffix}
    </Text>
  );
};
