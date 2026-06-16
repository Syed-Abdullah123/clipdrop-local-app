import React from 'react';
import Svg, {
  Rect,
  Path,
  G,
} from 'react-native-svg';

interface Props {
  size?: number;
}

const ClipDropLogo = ({ size = 120 }: Props) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 125 125"
    >
      {/* Upload Card - green, larger, tilted left, behind */}
      <G rotation={8} origin="42,55">
        <Rect
          x="14"
          y="8"
          width="50"
          height="100"
          rx="13"
          fill="#0e2c19"
          stroke="#4ade80"
          strokeWidth="3"
        />

        <Path
          d="M39 73 L39 43"
          stroke="#4ade80"
          strokeWidth="6"
          strokeLinecap="round"
        />

        <Path
          d="M28 54 L39 43 L50 54"
          stroke="#4ade80"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>

      {/* Download Card - blue, smaller, tilted right, in front */}
      <G rotation={8} origin="78,68">
        <Rect
          x="55"
          y="43"
          width="48"
          height="76"
          rx="12"
          fill="#112749"
          stroke="#3b82f6"
          strokeWidth="3"
        />

        <Path
          d="M79 66 L79 93"
          stroke="#3b82f6"
          strokeWidth="6"
          strokeLinecap="round"
        />

        <Path
          d="M68 82 L79 93 L90 82"
          stroke="#3b82f6"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
};

export default ClipDropLogo;