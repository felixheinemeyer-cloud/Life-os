import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface HomeIconProps {
  size?: number;
  color?: string;
}

const HomeIcon = ({ size = 24, color = '#000' }: HomeIconProps): React.JSX.Element => {
  // Add 6 pixels to make it 30x30
  const adjustedSize = size + 6;
  return (
    <Svg width={adjustedSize} height={adjustedSize} viewBox="0 0 24 24" fill="none">
      {/* House outline with uniformly rounded corners */}
      <Path
        d="M5 13.5V18C5 19.6569 6.34315 21 8 21H16C17.6569 21 19 19.6569 19 18V13.5C19 12.7 18.7 11.95 18.15 11.4L13.4 6.65C12.65 5.9 11.35 5.9 10.6 6.65L5.85 11.4C5.3 11.95 5 12.7 5 13.5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Horizontal line at bottom */}
      <Path
        d="M10 17H14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export default HomeIcon;
