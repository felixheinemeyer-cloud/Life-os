import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

interface Props {
  size?: number;
}

const OnboardingHeroGraphic = ({ size = 220 }: Props): React.JSX.Element => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 220 220">
        <Defs>
          {/* Full glow: white center → warm → purple → fade */}
          <RadialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="0.18" stopColor="#FFFFFF" stopOpacity="0.9" />
            <Stop offset="0.28" stopColor="#FFF0D4" stopOpacity="0.75" />
            <Stop offset="0.38" stopColor="#FDD8A0" stopOpacity="0.5" />
            <Stop offset="0.5" stopColor="#E8BAE8" stopOpacity="0.35" />
            <Stop offset="0.62" stopColor="#D4A8F0" stopOpacity="0.25" />
            <Stop offset="0.75" stopColor="#D8BEF0" stopOpacity="0.15" />
            <Stop offset="0.9" stopColor="#E0D6F0" stopOpacity="0.06" />
            <Stop offset="1" stopColor="#E0D6F0" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Single smooth glow */}
        <Circle cx={110} cy={110} r={110} fill="url(#glow)" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default OnboardingHeroGraphic;
