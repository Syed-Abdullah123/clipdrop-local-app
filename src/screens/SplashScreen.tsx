import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import ClipDropLogo from '../../assets/svg/ClipDropLogo'
import Animated, {
  useSharedValue,
  withTiming,
  withDelay,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated'
import type { RootStackParamList } from '../../App'

type SplashNavProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen = () => {
  const navigation = useNavigation<SplashNavProp>();

  const greenTranslateY = useSharedValue(120);
  const blueTranslateY = useSharedValue(-120);
  const textOpacity = useSharedValue(0);
  const subTextOpacity = useSharedValue(0);

  useEffect(() => {
    greenTranslateY.value = withTiming(0, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
    blueTranslateY.value = withTiming(0, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });

    textOpacity.value = withDelay(
      650,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })
    );
    subTextOpacity.value = withDelay(
      850,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })
    );

    // Navigate to Home after the animation has settled + a brief pause to read the text
    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const subTextAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subTextOpacity.value,
  }));

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0f0f0f',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ClipDropLogo
        size={140}
        greenTranslateY={greenTranslateY}
        blueTranslateY={blueTranslateY}
      />

      <Animated.Text
        style={[
          {
            marginTop: 24,
            color: '#fff',
            fontSize: 32,
            // fontWeight: '700',
            fontFamily: 'CabinetG_Bold',
          },
          textAnimatedStyle,
        ]}
      >
        ClipDrop
        <Text style={{ color: '#4ade80' }}>{' '}Local</Text>
      </Animated.Text>

      <Animated.Text
        style={[
          {
            letterSpacing: 1.5,
            color: '#a1a1aa',
            fontSize: 14,
            fontFamily: 'CabinetG_Regular',
          },
          subTextAnimatedStyle,
        ]}
      >
        SEND
        <Text style={{ color: '#4ade80', fontFamily: 'CabinetG_Regular', fontSize: 20 }}>{' '}.{' '}</Text>
        RECEIVE
        <Text style={{ color: '#4ade80', fontFamily: 'CabinetG_Regular', fontSize: 20 }}>{' '}.{' '}</Text>
        ANY FILE
      </Animated.Text>
    </View>
  )
}

export default SplashScreen

const styles = StyleSheet.create({})