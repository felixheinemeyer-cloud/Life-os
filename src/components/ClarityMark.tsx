import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface ClarityMarkProps {
  size?: number;
}

const ClarityMark = ({ size = 44 }: ClarityMarkProps): React.JSX.Element => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Purple crescent — large C shape (evening) */}
      <Path
        d="M 78 14 A 44 44 0 1 0 76 86 A 36 36 0 0 1 78 14 Z"
        fill="#7C3AED"
      />
      {/* Orange crescent — nested in the C opening (morning) */}
      <Path
        d="M 86 68 A 24 24 0 1 1 52 38 A 20 20 0 0 0 86 68 Z"
        fill="#F59E0B"
        opacity={0.88}
      />
    </Svg>
  );
};

export default ClarityMark;
