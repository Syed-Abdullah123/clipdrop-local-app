import React from 'react';
import Svg, { Rect, Path, G } from 'react-native-svg';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

const AnimatedG = Animated.createAnimatedComponent(G);

interface Props {
  size?: number;
  greenTranslateY: SharedValue<number>;
  blueTranslateY: SharedValue<number>;
}

const ClipDropLogo = ({
  size = 120,
  greenTranslateY,
  blueTranslateY,
}: Props) => {
  const greenAnimatedProps = useAnimatedProps(() => ({
    transform: [{ translateY: greenTranslateY.value }],
  }));

  const blueAnimatedProps = useAnimatedProps(() => ({
    transform: [{ translateY: blueTranslateY.value }],
  }));

  return (
    <Svg width={size} height={size} viewBox="0 0 125 125">
      {/* Upload Card */}
      <AnimatedG animatedProps={greenAnimatedProps}>
        <G rotation={8} origin="42,55">
          {/* Hard shadow */}
          <Rect x="18" y="12" width="50" height="100" rx="13" fill="#111111" />

          {/* Card */}
          <Rect
            x="14"
            y="8"
            width="50"
            height="100"
            rx="13"
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth="3"
          />

          {/* Upload arrow */}
          <Path
            d="M39 73 L39 43"
            stroke="#4ADE80"
            strokeWidth="6"
            strokeLinecap="round"
          />

          <Path
            d="M28 54 L39 43 L50 54"
            stroke="#4ADE80"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      </AnimatedG>

      {/* Download Card */}
      <AnimatedG animatedProps={blueAnimatedProps}>
        <G rotation={8} origin="78,68">
          {/* Hard shadow */}
          <Rect x="59" y="47" width="48" height="76" rx="12" fill="#111111" />

          {/* Card */}
          <Rect
            x="55"
            y="43"
            width="48"
            height="76"
            rx="12"
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth="3"
          />

          {/* Download arrow */}
          <Path
            d="M79 66 L79 93"
            stroke="#4D7CFE"
            strokeWidth="6"
            strokeLinecap="round"
          />

          <Path
            d="M68 82 L79 93 L90 82"
            stroke="#4D7CFE"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      </AnimatedG>
    </Svg>
  );
};

export default ClipDropLogo;