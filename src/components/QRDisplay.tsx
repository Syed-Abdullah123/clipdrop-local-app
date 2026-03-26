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
        <View style={styles.offlineBox}>
          <Text style={styles.offlineText}>Starting server...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>

        {/* QR Code */}
        <View style={styles.qrWrapper}>
          <QRCode
            value={url}
            size={160}
            color="#ffffff"
            backgroundColor="#1a1a1a"
          />
        </View>

        {/* URL + copy */}
        <TouchableOpacity onPress={handleCopy} activeOpacity={0.7}>
          <Text style={styles.urlText}>{url}</Text>
          <Text style={styles.copyHint}>Tap to copy</Text>
        </TouchableOpacity>

        {/* Status row */}
        <View style={styles.statusRow}>
          <View style={[styles.dot, connectedClients > 0 ? styles.dotActive : styles.dotIdle]} />
          <Text style={styles.statusText}>
            {connectedClients > 0
              ? `${connectedClients} browser${connectedClients > 1 ? 's' : ''} connected`
              : 'No browsers connected'}
          </Text>
        </View>

        <Text style={styles.hint}>
          Open the URL above on any device on the same Wi-Fi
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  urlText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  copyHint: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#4ade80',
  },
  dotIdle: {
    backgroundColor: '#444',
  },
  statusText: {
    fontSize: 13,
    color: '#888',
  },
  offlineBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  offlineText: {
    color: '#555',
    fontSize: 14,
  },
  hint: {
    fontSize: 12,
    color: '#444',
    textAlign: 'center',
    lineHeight: 18,
  },
});