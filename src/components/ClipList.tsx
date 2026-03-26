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
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
// import * as FileSystem from 'expo-file-system';
import { ClipItem } from '../types';
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
    case 'file':  return { bg: '#2a2a1e', fg: '#facc15' };
    default:      return { bg: '#1e1e1e', fg: '#888' };
  }
}

// Saves base64 image to a temp file and returns a file:// URI
function useImageURI(item: ClipItem): string | null {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    if (item.type !== 'image' || !item.content) return;

    const ext = item.mimeType?.split('/')[1] ?? 'jpg';
    const path = `${cacheDirectory}clip_${item.id}.${ext}`;

    writeAsStringAsync(path, item.content, {
      encoding: EncodingType.Base64,
    })
      .then(() => setUri(path))
      .catch((e) => console.error('Failed to write image:', e));
  }, [item.id]);

  return uri;
}

function ImageClip({ item }: { item: ClipItem }) {
  const uri = useImageURI(item);

  if (!uri) {
    return (
      <View style={styles.imagePlaceholder}>
        <Text style={styles.imagePlaceholderText}>Loading image...</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={styles.image}
      resizeMode="contain"
    />
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
      {item.type === 'image' && item.content ? (
        // <ImageClip item={item} />
        <Image
          source={{ uri: `data:${item.mimeType};base64,${item.content}` }}
          style={styles.image}
          resizeMode="contain"
        />
      ) : item.type === 'link' ? (
        <TouchableOpacity onPress={handleLinkPress} activeOpacity={0.7}>
          <Text style={styles.linkText} numberOfLines={3}>
            {item.content}
          </Text>
        </TouchableOpacity>
      ) : item.type === 'file' ? (
        <Text style={styles.contentText}>
          📎 {item.filename || 'File'}
        </Text>
      ) : (
        <Text style={styles.contentText} selectable>
          {item.content}
        </Text>
      )}

      {/* Copy button (not for images) */}
      {item.type !== 'image' && item.content ? (
        <TouchableOpacity onPress={handleCopy} style={styles.copyBtn} activeOpacity={0.7}>
          <Text style={styles.copyBtnText}>Copy</Text>
        </TouchableOpacity>
      ) : null}
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
});