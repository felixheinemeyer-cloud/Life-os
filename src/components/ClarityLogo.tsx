import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface ClarityLogoProps {
  size?: number;
  color?: string;
}

const ClarityLogo = ({ size = 32, color = '#1C1917' }: ClarityLogoProps): React.JSX.Element => {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* C shape — open arc */}
      <Path
        d="M34 12.5C31.2 9.1 27.1 7 22.5 7 14.5 7 8 13.5 8 21.5S14.5 36 22.5 36c4.6 0 8.7-2.1 11.5-5.5"
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      {/* Dot inside */}
      <Circle cx="22.5" cy="21.5" r="3.5" fill={color} />
    </Svg>
  );
};

export default ClarityLogo;
