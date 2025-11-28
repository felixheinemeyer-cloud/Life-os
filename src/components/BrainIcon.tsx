import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface BrainIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const BrainIcon = ({ size = 24, color = '#000', strokeWidth = 1.65 }: BrainIconProps): React.JSX.Element => {
  const adjustedSize = size + 4;
  return (
    <Svg width={adjustedSize} height={adjustedSize} viewBox="0 0 24 24" fill="none">
      {/* Lightbulb bulb */}
      <Path
        d="M12 3C8.5 3 6.5 5.5 6.5 9C6.5 11.5 7.7 13.5 10 15V18H14V15C16.3 13.5 17.5 11.5 17.5 9C17.5 5.5 15.5 3 12 3Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Base lines */}
      <Path
        d="M9.5 21H14.5M10 18H14"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default BrainIcon;
