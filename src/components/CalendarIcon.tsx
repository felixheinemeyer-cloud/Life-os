import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

interface CalendarIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const CalendarIcon = ({ size = 24, color = '#000', strokeWidth = 2 }: CalendarIconProps): React.JSX.Element => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Calendar body */}
      <Rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Top line */}
      <Path
        d="M3 9H21"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Left hook */}
      <Path
        d="M8 2V5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Right hook */}
      <Path
        d="M16 2V5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Calendar dots */}
      <Circle cx="8" cy="13" r="1" fill={color} />
      <Circle cx="12" cy="13" r="1" fill={color} />
      <Circle cx="16" cy="13" r="1" fill={color} />
      <Circle cx="8" cy="17" r="1" fill={color} />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
};

export default CalendarIcon;
