import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ToastAndroid,
  Image,
  Linking,
  ActivityIndicator,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { ClipItem } from '../types';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import {
  cacheDirectory,
  writeAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';

interface Props {
  clips: ClipItem[];
  onClear: () => void;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getBadgeStyle(type: ClipItem['type']) {
  switch (type) {
    case 'text':  return { bg: '#1e2a3a', fg: '#60a5fa' };
    case 'link':  return { bg: '#1a2e1a', fg: '#4ade80' };
    case 'image': return { bg: '#2a1e2e', fg: '#c084fc' };
    case 'video': return { bg: '#1e2a1e', fg: '#86efac' };
    case 'audio': return { bg: '#2a1e1e', fg: '#fca5a5' };
    case 'file':  return { bg: '#2a2a1e', fg: '#facc15' };
    default:      return { bg: '#1e1e1e', fg: '#888' };
  }
}

// Writes base64 content to cache and returns a file:// URI
function useCachedFileURI(item: ClipItem): string | null {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    if (!item.content || item.type === 'text' || item.type === 'link') return;

    const ext = item.mimeType?.split('/')[1]?.split(';')[0] ?? 'bin';
    const path = `${cacheDirectory}clip_${item.id}.${ext}`;

    writeAsStringAsync(path, item.content, { encoding: EncodingType.Base64 })
      .then(() => setUri(path))
      .catch((e) => console.error('Failed to write file:', e));
  }, [item.id]);

  return uri;
}

// Save image/video to media library, share everything else
async function saveOrShareFile(
  uri: string,
  type: ClipItem['type'],
  filename: string,
): Promise<void> {
  try {
    if (type === 'image' || type === 'video') {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        ToastAndroid.show('Storage permission denied', ToastAndroid.SHORT);
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      ToastAndroid.show(
        type === 'image' ? 'Image saved to gallery' : 'Video saved to gallery',
        ToastAndroid.SHORT,
      );
    } else {
      // For audio, PDF, docs — open share sheet
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: type === 'audio' ? 'audio/*' : '*/*',
          dialogTitle: `Save ${filename}`,
        });
      } else {
        ToastAndroid.show('Sharing not available', ToastAndroid.SHORT);
      }
    }
  } catch (e) {
    console.error('Save error:', e);
    ToastAndroid.show('Failed to save file', ToastAndroid.SHORT);
  }
}

// --- Image ---
function ImageClip({ item }: { item: ClipItem }) {
  const uri = useCachedFileURI(item);
  if (!uri) return (
    <View style={styles.mediaPlaceholder}>
      <Text style={styles.placeholderText}>Loading image...</Text>
    </View>
  );
  return (
    <View>
      <Image source={{ uri }} style={styles.image} resizeMode="contain" />
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={() => saveOrShareFile(uri, 'image', item.filename ?? 'image')}
        activeOpacity={0.7}
      >
        <Text style={styles.saveBtnText}>⬇ Save to gallery</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- Video ---
function VideoClip({ item }: { item: ClipItem }) {
  const uri = useCachedFileURI(item);
  const player = useVideoPlayer(uri ?? '', (p) => {
    p.loop = false;
  });

  if (!uri) return (
    <View style={styles.mediaPlaceholder}>
      <Text style={styles.placeholderText}>Loading video...</Text>
    </View>
  );

  return (
    <View>
      <VideoView
        player={player}
        style={styles.video}
        allowsFullscreen
        allowsPictureInPicture={false}
      />
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={() => saveOrShareFile(uri, 'video', item.filename ?? 'video')}
        activeOpacity={0.7}
      >
        <Text style={styles.saveBtnText}>⬇ Save to gallery</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- Audio ---
function AudioClip({ item }: { item: ClipItem }) {
  const uri = useCachedFileURI(item);

  // Always call hook at top level
  const player = useAudioPlayer(uri ? { uri } : undefined);
  const status = useAudioPlayerStatus(player);

  const isLoaded = !!player && !!uri;
  const isPlaying = !!status?.playing;

  // When track finishes, seek back to start so it can be replayed
  useEffect(() => {
    if (status && !status.playing && status.currentTime > 0) {
      const duration = status.duration ?? 0;
      const isFinished = duration > 0 && status.currentTime >= duration - 0.5;
      if (isFinished) {
        player?.seekTo(0);
        player?.pause();
      }
    }
  }, [status?.playing]);

  const togglePlay = () => {
    if (!player) return;

    if (isPlaying) {
      player.pause();
    } else {
      // if already finished, remove and create a new one
      try { player.remove(); } catch {}
      player.play();
    }
  };

  useEffect(() => {
    // cleanup on unmount
    return () => {
      try { player?.remove(); } catch {}
    };
  }, [player]);

  // Format seconds to m:ss
  const formatDuration = (secs: number): string => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentTime = status?.currentTime ?? 0;
  const duration = status?.duration ?? 0;
  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <View style={styles.audioCard}>
      <Text style={styles.audioFilename} numberOfLines={1}>
        🎵 {item.filename ?? 'Audio file'}
      </Text>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Time row + play button */}
      <View style={styles.audioControls}>
        <Text style={styles.audioTime}>
          {formatDuration(currentTime)}
        </Text>
        <TouchableOpacity
          onPress={togglePlay}
          disabled={!isLoaded}
          style={[styles.playBtn, !isLoaded && styles.playBtnDisabled]}
          activeOpacity={0.7}
        >
          <Text style={styles.playBtnText}>
            {!isLoaded ? 'Loading...' : isPlaying ? '⏸ Pause' : '▶ Play'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.audioTime}>
          {formatDuration(duration)}
        </Text>
      </View>

      {uri && (
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => saveOrShareFile(uri, 'audio', item.filename ?? 'audio')}
          activeOpacity={0.7}
        >
          <Text style={styles.saveBtnText}>⬇ Save file</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// --- Generic file ---
function FileClip({ item }: { item: ClipItem }) {
  const uri = useCachedFileURI(item);

  const getFileIcon = (mimeType?: string): string => {
    if (!mimeType) return '📎';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('doc')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return '🗜️';
    if (mimeType.includes('text')) return '📃';
    return '📎';
  };

  function getReadableMimeType(mimeType?: string): string {
    if (!mimeType) return 'Unknown file';

    const map: Record<string, string> = {
      'application/pdf': 'PDF Document',
      'application/msword': 'Word Document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
      'application/vnd.ms-excel': 'Excel Spreadsheet',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
      'application/vnd.ms-powerpoint': 'PowerPoint Presentation',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint Presentation',
      'application/zip': 'ZIP Archive',
      'application/x-rar-compressed': 'RAR Archive',
      'application/x-7z-compressed': '7-Zip Archive',
      'application/json': 'JSON File',
      'application/xml': 'XML File',
      'application/octet-stream': 'Binary File',
      'text/plain': 'Text File',
      'text/html': 'HTML File',
      'text/css': 'CSS File',
      'text/csv': 'CSV Spreadsheet',
      'text/javascript': 'JavaScript File',
    };

    if (map[mimeType]) return map[mimeType];

    // Fallback: clean up the raw mime type
    // e.g. "application/x-zip-compressed" → "Zip Compressed"
    const [, subtype] = mimeType.split('/');
    if (!subtype) return mimeType;

    return subtype
      .replace(/^x-/, '')
      .replace(/[-_.+]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }

  return (
    <View style={styles.fileCard}>
      <View style={styles.fileInfo}>
        <Text style={styles.fileIcon}>{getFileIcon(item.mimeType)}</Text>
        <View style={styles.fileDetails}>
          <Text style={styles.fileFilename} numberOfLines={2}>
            {item.filename ?? 'File'}
          </Text>
          <Text style={styles.fileMime}>{getReadableMimeType(item.mimeType)}</Text>
        </View>
      </View>
      {uri && (
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => saveOrShareFile(uri, 'file', item.filename ?? 'file')}
          activeOpacity={0.7}
        >
          <Text style={styles.saveBtnText}>⬇ Save / Open</Text>
        </TouchableOpacity>
      )}
      {!uri && (
        <Text style={styles.placeholderText}>Preparing file...</Text>
      )}
    </View>
  );
}

// Add this component
function PendingCard({ item }: { item: ClipItem }) {
  const badge = getBadgeStyle(item.type);
  const isSent = item.direction === 'sent';
  const progress = item.progress ?? 0;
  const showPct = progress > 0;

  return (
    <View style={[styles.card, isSent ? styles.cardSent : styles.cardReceived]}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.fg }]}>
            {item.type.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.direction}>{isSent ? '↑ Sending...' : '↓ Receiving...'}</Text>
        {showPct && (
          <Text style={styles.progressPct}>{progress}%</Text>
        )}
      </View>
      {item.filename && (
        <Text style={styles.pendingFilename} numberOfLines={1}>
          {item.filename}
        </Text>
      )}
    </View>
  );
}

function ClipItemCard({ item }: { item: ClipItem }) {
  const badge = getBadgeStyle(item.type);
  const isSent = item.direction === 'sent';

  const handleCopy = () => {
    if (!item.content) return;
    Clipboard.setString(item.content);
    ToastAndroid.show('Copied!', ToastAndroid.SHORT);
  };

  const handleLinkPress = () => {
    if (item.type === 'link') Linking.openURL(item.content);
  };

  const showCopyBtn = item.type === 'text' || item.type === 'link';

  // Show skeleton while pending
  if (item.status === 'pending') return <PendingCard item={item} />;

  return (
    <View style={[styles.card, isSent ? styles.cardSent : styles.cardReceived]}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.fg }]}>
            {item.type.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.direction}>
          {isSent ? '↑ Sent' : '↓ Received'}
        </Text>
        <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
      </View>

      {/* Content */}
      {item.type === 'image' && <ImageClip item={item} />}
      {item.type === 'video' && <VideoClip item={item} />}
      {item.type === 'audio' && <AudioClip item={item} />}
      {item.type === 'file'  && <FileClip item={item} />}
      {item.type === 'link' && (
        <TouchableOpacity onPress={handleLinkPress} activeOpacity={0.7}>
          <Text style={styles.linkText} numberOfLines={3}>{item.content}</Text>
        </TouchableOpacity>
      )}
      {item.type === 'text' && (
        <Text style={styles.contentText} selectable>{item.content}</Text>
      )}

      {showCopyBtn && (
        <TouchableOpacity onPress={handleCopy} style={styles.copyBtn} activeOpacity={0.7}>
          <Text style={styles.copyBtnText}>Copy</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ClipList({ clips, onClear }: Props) {
  if (clips.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nothing yet</Text>
        <Text style={styles.emptySubText}>
          Send something from the browser or use the input below
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>CLIP FEED</Text>
        <TouchableOpacity onPress={onClear} activeOpacity={0.7}>
          <Text style={styles.clearText}>Clear all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={clips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ClipItemCard item={item} />}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#444',
    letterSpacing: 0.8,
  },
  clearText: {
    fontSize: 13,
    color: '#555',
  },
  listContent: {
    paddingBottom: 20,
  },
  separator: {
    height: 10,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardSent: {
    borderLeftWidth: 2,
    borderLeftColor: '#3b82f6',
  },
  cardReceived: {
    borderLeftWidth: 2,
    borderLeftColor: '#4ade80',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  direction: {
    fontSize: 11,
    color: '#444',
  },
  progressPct: {
    fontSize: 11,
    color: '#4ade80',
    marginLeft: 'auto',
    fontWeight: '600',
  },
  time: {
    fontSize: 11,
    color: '#444',
    marginLeft: 'auto',
  },
  contentText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  linkText: {
    fontSize: 14,
    color: '#60a5fa',
    lineHeight: 20,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#111',
  },
  imagePlaceholder: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 13,
    color: '#444',
  },
  video: { width: '100%', height: 200, borderRadius: 8, backgroundColor: '#111' },
  mediaPlaceholder: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { fontSize: 13, color: '#444' },
  audioCard: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  audioFilename: { fontSize: 13, color: '#aaa' },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ade80',
    borderRadius: 2,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  audioTime: {
    fontSize: 11,
    color: '#555',
    minWidth: 32,
  },
  playBtn: {
    backgroundColor: '#222',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#333',
  },
  playBtnDisabled: { opacity: 0.4 },
  playBtnText: { fontSize: 13, color: '#e8e8e8', fontWeight: '500' },
  fileCard: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileIcon: { fontSize: 32 },
  fileDetails: { flex: 1 },
  fileFilename: {
    fontSize: 14,
    color: '#e8e8e8',
    fontWeight: '500',
    lineHeight: 20,
  },
  fileMime: {
    fontSize: 11,
    color: '#555',
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginTop: 12,
  },
  saveBtnText: {
    fontSize: 13,
    color: '#4ade80',
    fontWeight: '500',
  },
  copyBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#222',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  copyBtnText: {
    fontSize: 12,
    color: '#888',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  emptySubText: {
    fontSize: 13,
    color: '#2a2a2a',
    textAlign: 'center',
    lineHeight: 18,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  pendingText: {
    fontSize: 13,
    color: '#555',
    fontStyle: 'italic',
  },
  pendingFilename: {
    fontSize: 12,
    color: '#555',
    marginBottom: 2,
  },
  pendingTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  pendingFill: {
    height: '100%',
    borderRadius: 2,
  },
  pendingFillSent: {
    backgroundColor: '#3b82f6',
  },
  pendingFillReceived: {
    backgroundColor: '#4ade80',
  },
  pendingFillIndeterminate: {
    width: '40%',
  },
});