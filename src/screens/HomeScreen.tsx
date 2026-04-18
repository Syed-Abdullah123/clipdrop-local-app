import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  // KeyboardAvoidingView,
  Platform,
  ToastAndroid,
  Modal,
  Pressable,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
// import * as FileSystem from 'expo-file-system';
import {
  readAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useLocalServer } from '../hooks/useLocalServer';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRDisplay from '../components/QRDisplay';
import ClipList from '../components/ClipList';

function isLink(text: string): boolean {
  return /^https?:\/\//.test(text.trim());
}

export default function HomeScreen() {
  const { serverState, clips, sendClip, clearClips, addPendingClip, updateClip, updateClipProgress } = useLocalServer();
  const [inputText, setInputText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendingLabel, setSendingLabel] = useState('');
  const [activeSendingId, setActiveSendingId] = useState<string | null>(null);

  const activeClip = clips.find(c => c.id === activeSendingId);
  const progress = activeClip?.progress ?? 0;

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;

    sendClip({
      type: isLink(text) ? 'link' : 'text',
      content: text,
    });

    setInputText('');
  };

  const sendFileAsClip = async (
    uri: string,
    filename: string,
    mimeType: string,
  ) => {
    let type: 'image' | 'video' | 'audio' | 'file' = 'file';
    if (mimeType.startsWith('image/')) type = 'image';
    else if (mimeType.startsWith('video/')) type = 'video';
    else if (mimeType.startsWith('audio/')) type = 'audio';

    // Add pending placeholder immediately so user sees it in feed
    const pendingId = addPendingClip(type, 'sent', filename, mimeType);
    setActiveSendingId(pendingId);
    setIsSending(true);
    updateClipProgress(pendingId, 1);
    setSendingLabel(`Reading ${filename}...`);

    // Animate progress while reading — FileSystem gives no progress events
    let fakeProgress = 0;
    const progressInterval = setInterval(() => {
      fakeProgress = Math.min(85, fakeProgress + 4);
      updateClipProgress(pendingId, fakeProgress);
    }, 200);

    try {
      const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
      clearInterval(progressInterval);

      setSendingLabel(`Sending ${filename}...`);
      updateClipProgress(pendingId, 90);

      const { sendToClients } = await import('../server/wsServer');
      const id = pendingId;
      const msg = { type, content: base64, filename, mimeType, id: pendingId };

      updateClipProgress(pendingId, Math.max(progress, 90));
      // Send over WebSocket
      sendToClients(msg);

      // Update the pending clip to ready
      updateClip(pendingId, base64);
      updateClipProgress(pendingId, 100);
    } catch (e) {
      clearInterval(progressInterval);
      console.error('File read error:', e);
      ToastAndroid.show('Failed to send file', ToastAndroid.SHORT);
      // Remove the pending clip on failure
      updateClip(pendingId, '');
    } finally {
      setActiveSendingId(null);
      setIsSending(false);
      setSendingLabel('');
    }
  };

  const handlePickImage = async () => {
    setShowAttachMenu(false);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { ToastAndroid.show('Permission denied', ToastAndroid.SHORT); return; }

      const pendingId = addPendingClip('image', 'sent');
      setActiveSendingId(pendingId);
      setIsSending(true);
      setSendingLabel('Reading image...');

      let fakeProgress = 0;
      const progressInterval = setInterval(() => {
        fakeProgress = Math.min(85, fakeProgress + 6);
        updateClipProgress(pendingId, fakeProgress);
      }, 150);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.7,
        base64: true,
      });

      clearInterval(progressInterval);

      if (result.canceled || !result.assets[0] || !result.assets[0].base64) {
        updateClip(pendingId, '');
        setIsSending(false);
        return;
      }

      const asset = result.assets[0];
      setSendingLabel('Sending image...');
      updateClipProgress(pendingId, 90);

      const { sendToClients } = await import('../server/wsServer');
      const msg = {
        type: 'image' as const,
        content: asset.base64!,
        filename: asset.fileName ?? `image_${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
        id: pendingId,
      };
      sendToClients(msg);
      updateClip(pendingId, asset.base64!);
      updateClipProgress(pendingId, 100);
    } catch (e) {
      ToastAndroid.show('Failed to pick image', ToastAndroid.SHORT);
    } finally {
      setActiveSendingId(null);
      setIsSending(false);
      setSendingLabel('');
    }
  };

  const handlePickVideo = async () => {
    setShowAttachMenu(false);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { ToastAndroid.show('Permission denied', ToastAndroid.SHORT); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'videos',
        quality: 0.7,
        base64: false,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      await sendFileAsClip(
        asset.uri,
        asset.fileName ?? `video_${Date.now()}.mp4`,
        asset.mimeType ?? 'video/mp4',
      );
    } catch (e) {
      ToastAndroid.show('Failed to pick video', ToastAndroid.SHORT);
    }
  };

  // Pick any file (audio, PDF, doc, etc.)
  const handlePickFile = async () => {
    setShowAttachMenu(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      await sendFileAsClip(
        asset.uri,
        asset.name,
        asset.mimeType ?? 'application/octet-stream',
      );
    } catch (e) {
      ToastAndroid.show('Failed to pick file', ToastAndroid.SHORT);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ClipDrop Local</Text>
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
          {/* Inline send progress — replaces blocking modal */}
          {isSending && (
            <View style={styles.sendProgressBar}>
              <View style={styles.sendProgressInner}>
                <ActivityIndicator size="small" color="#4ade80" />
                <Text style={styles.sendProgressLabel} numberOfLines={1}>
                  {sendingLabel}
                </Text>
              </View>
              <View style={styles.sendProgressTrack}>
                <View
                  style={[
                    styles.sendProgressFill,
                    { width: `${progress}%` },
                  ]}
                />
              </View>
            </View>
          )}

          {!isSending && (
            <View style={styles.sendRow}>
              <TouchableOpacity
                style={styles.mediaBtn}
                onPress={() => setShowAttachMenu(true)}
                activeOpacity={0.7}
                disabled={!serverState.isRunning}
              >
                <Text style={styles.mediaBtnText}>+</Text>
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
                  (!inputText.trim() || !serverState.isRunning) && styles.sendBtnDisabled,
                ]}
                onPress={handleSend}
                disabled={!inputText.trim() || !serverState.isRunning}
                activeOpacity={0.8}
              >
                <Text style={styles.sendBtnText}>Send</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Attach menu modal */}
      <Modal
        visible={showAttachMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttachMenu(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAttachMenu(false)}
        >
          <View style={styles.attachMenu}>
            <Text style={styles.attachTitle}>Send attachment</Text>

            <TouchableOpacity style={styles.attachOption} onPress={handlePickImage}>
              <Text style={styles.attachOptionIcon}>🖼️</Text>
              <View>
                <Text style={styles.attachOptionLabel}>Image</Text>
                <Text style={styles.attachOptionSub}>JPG, PNG, GIF, WEBP</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.attachOption} onPress={handlePickVideo}>
              <Text style={styles.attachOptionIcon}>🎬</Text>
              <View>
                <Text style={styles.attachOptionLabel}>Video</Text>
                <Text style={styles.attachOptionSub}>MP4, MOV, AVI</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.attachOption} onPress={handlePickFile}>
              <Text style={styles.attachOptionIcon}>📎</Text>
              <View>
                <Text style={styles.attachOptionLabel}>File</Text>
                <Text style={styles.attachOptionSub}>Audio, PDF, DOC, and more</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attachCancel}
              onPress={() => setShowAttachMenu(false)}
            >
              <Text style={styles.attachCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
  headerLogo: {
    width: 42,
    height: 42,
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
  sendProgressBar: {
    flex: 1,
    gap: 8,
    paddingVertical: 4,
  },
  sendProgressInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sendProgressLabel: {
    flex: 1,
    fontSize: 13,
    color: '#aaa',
  },
  sendProgressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  sendProgressFill: {
    height: '100%',
    width: '60%',
    backgroundColor: '#4ade80',
    borderRadius: 2,
  },
  sendRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  mediaBtn: {
    width: 24,
    height: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  mediaBtnText: {
    fontSize: 20,
    color: '#e8e8e8',
    lineHeight: 20,
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
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  attachMenu: {
    backgroundColor: '#161616',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 4,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  attachTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  attachOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  attachOptionIcon: { fontSize: 24 },
  attachOptionLabel: {
    fontSize: 16,
    color: '#e8e8e8',
    fontWeight: '500',
  },
  attachOptionSub: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  attachCancel: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 4,
  },
  attachCancelText: {
    fontSize: 15,
    color: '#666',
  },
});