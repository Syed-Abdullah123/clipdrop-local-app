import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
//   Clipboard,
  ToastAndroid,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import QRCode from 'react-native-qrcode-svg';
import { ServerState } from '../types';

interface Props {
  serverState: ServerState;
}

export default function QRDisplay({ serverState }: Props) {
  const { isRunning, ipAddress, port, connectedClients } = serverState;
  const url = ipAddress ? `http://${ipAddress}:${port}` : null;

  const handleCopy = () => {
    if (!url) return;
    Clipboard.setString(url);
    ToastAndroid.show('URL copied!', ToastAndroid.SHORT);
  };

  if (!isRunning || !url) {
    return (
      <View style={styles.container}>
        <View style={styles.offlineCard}>
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineBadgeText}>SERVER</Text>
          </View>

          <Text style={styles.offlineTitle}>Starting server...</Text>

          <Text style={styles.offlineHint}>
            Preparing your local connection
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Card heading */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.eyebrow}>LOCAL CONNECTION</Text>

            <Text style={styles.title}>Scan to connect</Text>
          </View>

          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* QR Code */}
        <View style={styles.qrOuter}>
          <View style={styles.qrWrapper}>
            <QRCode
              value={url}
              size={175}
              color="#111111"
              backgroundColor="#FFFFFF"
            />
          </View>
        </View>

        {/* URL */}
        <TouchableOpacity
          onPress={handleCopy}
          activeOpacity={0.75}
          style={styles.urlButton}
        >
          <View style={styles.urlContent}>
            <Text
              style={styles.urlText}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {url}
            </Text>

            <Text style={styles.copyText}>COPY</Text>
          </View>
        </TouchableOpacity>

        {/* Connection status */}
        <View style={styles.connectionBox}>
          <View
            style={[
              styles.connectionIndicator,
              connectedClients > 0
                ? styles.connectionActive
                : styles.connectionIdle,
            ]}
          />

          <View style={styles.connectionTextContainer}>
            <Text style={styles.connectionTitle}>
              {connectedClients > 0
                ? `${connectedClients} browser${
                    connectedClients > 1 ? "s" : ""
                  } connected`
                : "Waiting for connection"}
            </Text>

            <Text style={styles.connectionSubtitle}>
              {connectedClients > 0
                ? "Your devices are connected locally"
                : "No browsers connected yet"}
            </Text>
          </View>
        </View>

        {/* Hint */}
        <View style={styles.hintBox}>
          <Text style={styles.hintNumber}>01</Text>

          <Text style={styles.hint}>
            Open the URL above on any device connected to the same Wi-Fi
            network.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderWidth: 3,
    borderColor: '#111111',
    boxShadow: '6px 6px 0px #111111',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  eyebrow: {
    fontSize: 10,
    fontFamily: 'Manrope_Bold',
    color: '#4D7CFE',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontFamily: 'CabinetG_Bold',
    color: '#111111',
    letterSpacing: -1,
    lineHeight: 31,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: '#4ADE80',
    borderWidth: 2,
    borderColor: '#111111',
  },
  liveDot: {
    width: 7,
    height: 7,
    backgroundColor: '#111111',
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontFamily: 'Manrope_Bold',
    color: '#111111',
    letterSpacing: 0.7,
  },
  qrOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE14A',
    padding: 14,
    borderWidth: 3,
    borderColor: '#111111',
    marginBottom: 18,
    boxShadow: '4px 4px 0px #111111',
  },
  qrWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderWidth: 2,
    borderColor: '#111111',
  },
  urlButton: {
    backgroundColor: '#111111',
    borderWidth: 3,
    borderColor: '#111111',
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginBottom: 16,
  },
  urlContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urlText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Manrope_Bold',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  copyText: {
    fontSize: 10,
    fontFamily: 'Manrope_Bold',
    color: '#FFE14A',
    marginLeft: 10,
    letterSpacing: 1,
  },
  connectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F0E8',
    padding: 13,
    borderWidth: 2,
    borderColor: '#111111',
    marginBottom: 16,
  },
  connectionIndicator: {
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: '#111111',
    marginRight: 11,
  },
  connectionActive: {
    backgroundColor: '#4ADE80',
  },
  connectionIdle: {
    backgroundColor: '#FF6B6B',
  },
  connectionTextContainer: {
    flex: 1,
  },
  connectionTitle: {
    fontSize: 13,
    fontFamily: 'Manrope_Bold',
    color: '#111111',
    marginBottom: 2,
  },
  connectionSubtitle: {
    fontSize: 11,
    fontFamily: 'Manrope_Regular',
    color: '#666666',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 2,
  },
  hintNumber: {
    fontSize: 11,
    fontFamily: 'Manrope_Bold',
    color: '#FF6B6B',
    marginRight: 9,
    letterSpacing: 0.5,
  },
  hint: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Manrope_Regular',
    color: '#555555',
    lineHeight: 17,
  },
  offlineCard: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderWidth: 3,
    borderColor: '#111111',
    shadowColor: '#111111',
    shadowOffset: {
      width: 5,
      height: 5,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  offlineBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 2,
    borderColor: '#111111',
    marginBottom: 14,
  },
  offlineBadgeText: {
    fontSize: 10,
    fontFamily: 'Manrope_Bold',
    color: '#111111',
    letterSpacing: 0.8,
  },
  offlineTitle: {
    fontSize: 22,
    fontFamily: 'CabinetG_Bold',
    color: '#111111',
    marginBottom: 5,
  },
  offlineHint: {
    fontSize: 12,
    fontFamily: 'Manrope_Regular',
    color: '#666666',
  },
});
