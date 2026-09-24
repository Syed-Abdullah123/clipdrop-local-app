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
        fullscreenOptions={{ enable: true }}
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
          {isSent ? '↑ SENT' : '↓ RECEIVED'}
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
    marginBottom: 14,
  },
  listHeaderText: {
    fontSize: 12,
    fontFamily: 'Manrope_Bold',
    color: '#111111',
    letterSpacing: 1.2,
  },
  clearText: {
    fontSize: 11,
    fontFamily: 'Manrope_Bold',
    color: '#111111',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FF6B6B',
    borderWidth: 2,
    borderColor: '#111111',
    boxShadow: '2px 2px 0px #111111',
  },
  listContent: {
    paddingBottom: 20,
  },
  separator: {
    height: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderWidth: 3,
    borderColor: '#111111',
    gap: 12,
    boxShadow: '5px 5px 0px #111111',
  },
  cardSent: {
    borderLeftWidth: 7,
    borderLeftColor: '#4D7CFE',
  },
  cardReceived: {
    borderLeftWidth: 7,
    borderLeftColor: '#4ADE80',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 2,
    borderColor: '#111111',
  },
  badgeText: {
    fontSize: 9,
    fontFamily: 'Manrope_Bold',
    color: '#111111',
    letterSpacing: 0.8,
  },
  direction: {
    fontSize: 10,
    fontFamily: 'Manrope_Bold',
    color: '#555555',
    letterSpacing: 0.2,
  },
  time: {
    fontSize: 10,
    fontFamily: 'Manrope_Regular',
    color: '#888888',
    marginLeft: 'auto',
  },
  progressPct: {
    fontSize: 11,
    fontFamily: 'Manrope_Bold',
    color: '#111111',
    marginLeft: 'auto',
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: '#FFE14A',
    borderWidth: 1,
    borderColor: '#111111',
  },
  contentText: {
    fontSize: 15,
    color: '#111111',
    lineHeight: 22,
    fontFamily: 'Manrope_Regular',
  },
  linkText: {
    fontSize: 15,
    fontFamily: 'Manrope_Bold',
    color: '#315DD8',
    lineHeight: 22,
    textDecorationLine: 'underline',
  },
  image: {
    width: '100%',
    height: 220,
    backgroundColor: '#F4F0E8',
    borderWidth: 2,
    borderColor: '#111111',
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#F4F0E8',
    borderWidth: 2,
    borderColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Manrope_Medium',
  },
  video: {
    width: '100%',
    height: 220,
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: '#111111',
  },
  mediaPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#F4F0E8',
    borderWidth: 2,
    borderColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Manrope_Regular',
  },
  audioCard: {
    backgroundColor: '#111111',
    padding: 14,
    borderWidth: 3,
    borderColor: '#111111',
    gap: 11,
    boxShadow: '3px 3px 0px #FF6B6B',
  },
  audioFilename: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: 'Manrope_Bold',
  },
  progressTrack: {
    width: '100%',
    height: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ADE80',
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  audioTime: {
    fontSize: 10,
    fontFamily: 'Manrope_Bold',
    color: '#AAAAAA',
    minWidth: 32,
  },
  playBtn: {
    backgroundColor: '#FFE14A',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  playBtnDisabled: {
    opacity: 0.4,
  },
  playBtnText: {
    fontSize: 11,
    color: '#111111',
    fontFamily: 'Manrope_Bold',
    letterSpacing: 0.5,
  },
  fileCard: {
    backgroundColor: '#F4F0E8',
    padding: 13,
    borderWidth: 2,
    borderColor: '#111111',
    gap: 12,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileIcon: {
    fontSize: 28,
    width: 46,
    height: 46,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: '#FFE14A',
    borderWidth: 2,
    borderColor: '#111111',
  },
  fileDetails: {
    flex: 1,
  },
  fileFilename: {
    fontSize: 14,
    color: '#111111',
    fontFamily: 'Manrope_Bold',
    lineHeight: 19,
  },
  fileMime: {
    fontSize: 10,
    fontFamily: 'Manrope_Regular',
    color: '#666666',
    marginTop: 3,
  },
  saveBtn: {
    backgroundColor: '#4ADE80',
    paddingVertical: 9,
    paddingHorizontal: 13,
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: '#111111',
    marginTop: 2,
    boxShadow: '2px 2px 0px #111111',
  },
  saveBtnText: {
    fontSize: 11,
    color: '#111111',
    fontFamily: 'Manrope_Bold',
    letterSpacing: 0.3,
  },
  copyBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFE14A',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderWidth: 2,
    borderColor: '#111111',
    boxShadow: '2px 2px 0px #111111',
  },
  copyBtnText: {
    fontSize: 10,
    fontFamily: 'Manrope_Bold',
    color: '#111111',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 52,
    paddingHorizontal: 35,
    gap: 9,
  },
  emptyText: {
    fontSize: 22,
    color: '#111111',
    fontFamily: 'CabinetG_Bold',
    letterSpacing: -0.5,
  },
  emptySubText: {
    fontSize: 12,
    fontFamily: 'Manrope_Regular',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  pendingText: {
    fontSize: 13,
    color: '#555555',
    fontStyle: 'italic',
  },
  pendingFilename: {
    fontSize: 12,
    fontFamily: 'Manrope_Bold',
    color: '#555555',
    marginBottom: 2,
  },
  pendingTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#111111',
    overflow: 'hidden',
  },
  pendingFill: {
    height: '100%',
  },
  pendingFillSent: {
    backgroundColor: '#4D7CFE',
  },
  pendingFillReceived: {
    backgroundColor: '#4ADE80',
  },
  pendingFillIndeterminate: {
    width: '40%',
  },
});