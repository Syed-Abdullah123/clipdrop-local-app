import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import ClipDropLogo from '../../assets/svg/ClipDropLogo'

const SplashScreen = () => {
  return (
    <View
  style={{
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
  }}
>
  <ClipDropLogo size={140} />

  <Text
    style={{
      marginTop: 24,
      color: '#fff',
      fontSize: 32,
      fontWeight: '700',
    }}
  >
    ClipDrop
    <Text style={{ color: '#4ade80' }}>
      {' '}Local
    </Text>
  </Text>

  <Text
    style={{
      letterSpacing: 1.5,
      color: '#a1a1aa',
      fontSize: 14,
      fontWeight: '400',
    }}
  >
    SEND
    <Text style={{ color: '#4ade80', fontWeight: '700', fontSize: 20 }}>
      {' '}.{' '}
    </Text>
    RECEIVE
        <Text style={{ color: '#4ade80', fontWeight: '700', fontSize: 20 }}>
      {' '}.{' '}
    </Text>
    ANY FILE
  </Text>
</View>
  )
}

export default SplashScreen

const styles = StyleSheet.create({})