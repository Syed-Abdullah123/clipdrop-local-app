import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
// import * as FileSystem from 'expo-file-system';
import { useLocalServer } from '../hooks/useLocalServer';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRDisplay from '../components/QRDisplay';
import ClipList from '../components/ClipList';

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function isLink(text: string): boolean {
  return /^https?:\/\//.test(text.trim());
}

export default function HomeScreen() {
  const { serverState, clips, sendClip, clearClips } = useLocalServer();
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;

    sendClip({
      type: isLink(text) ? 'link' : 'text',
      content: text,
    });

    setInputText('');
  };

  const handlePickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        ToastAndroid.show("Permission denied", ToastAndroid.SHORT);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images", // replaces deprecated MediaTypeOptions.Images
        quality: 0.7,
        base64: true, // let expo-image-picker do the base64 conversion
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];

      if (!asset.base64) {
        ToastAndroid.show("Failed to read image", ToastAndroid.SHORT);
        return;
      }

      const mimeType = asset.mimeType ?? "image/jpeg";
      const filename = asset.fileName ?? `image_${Date.now()}.jpg`;

      sendClip({
        type: "image",
        content: asset.base64,
        filename,
        mimeType,
      });
    } catch (e) {
      console.error("Image pick error:", e);
      ToastAndroid.show("Failed to pick image", ToastAndroid.SHORT);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📋 ClipDrop Local</Text>
          <View style={styles.headerRight}>
            <View
              style={[
                styles.serverDot,
                serverState.isRunning
                  ? styles.serverDotOn
                  : styles.serverDotOff,
              ]}
            />
            <Text style={styles.headerStatus}>
              {serverState.isRunning ? "Running" : "Starting..."}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* QR + connection info */}
          <QRDisplay serverState={serverState} />

          {/* Divider */}
          <View style={styles.divider} />

          {/* Clip feed */}
          <ClipList clips={clips} onClear={clearClips} />
        </ScrollView>

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.mediaBtn}
            onPress={handlePickImage}
            activeOpacity={0.7}
            disabled={!serverState.isRunning}
          >
            <Text style={styles.mediaBtnText}>🖼</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type or paste something..."
            placeholderTextColor="#444"
            multiline
            maxLength={5000}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || !serverState.isRunning) &&
                styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || !serverState.isRunning}
            activeOpacity={0.8}
          >
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serverDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  serverDotOn: {
    backgroundColor: '#4ade80',
  },
  serverDotOff: {
    backgroundColor: '#ff4444',
  },
  headerStatus: {
    fontSize: 12,
    color: '#666',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#1e1e1e',
    marginHorizontal: 20,
    marginVertical: 20,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
    backgroundColor: '#0f0f0f',
    gap: 10,
  },
  mediaBtn: {
    width: 24,
    height: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  mediaBtnText: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#e8e8e8',
    maxHeight: 120,
    lineHeight: 20,
  },
  sendBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-end',
  },
  sendBtnDisabled: {
    backgroundColor: '#1e1e1e',
  },
  sendBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f0f0f',
  },
});