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

const ClipDropLogo = ({ size = 120, greenTranslateY, blueTranslateY }: Props) => {
  const greenAnimatedProps = useAnimatedProps(() => ({
    transform: [{ translateY: greenTranslateY.value }],
  }));

  const blueAnimatedProps = useAnimatedProps(() => ({
    transform: [{ translateY: blueTranslateY.value }],
  }));

  return (
    <Svg width={size} height={size} viewBox="0 0 125 125">
      {/* Upload Card - green, slides up from bottom */}
      <AnimatedG animatedProps={greenAnimatedProps}>
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
          <Path d="M39 73 L39 43" stroke="#4ade80" strokeWidth="6" strokeLinecap="round" />
          <Path
            d="M28 54 L39 43 L50 54"
            stroke="#4ade80"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      </AnimatedG>

      {/* Download Card - blue, slides down from top */}
      <AnimatedG animatedProps={blueAnimatedProps}>
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
          <Path d="M79 66 L79 93" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" />
          <Path
            d="M68 82 L79 93 L90 82"
            stroke="#3b82f6"
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