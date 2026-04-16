import { useState, useEffect, useCallback, useRef } from 'react';
import { NetworkInfo } from 'react-native-network-info';
import { startHTTPServer, stopHTTPServer, HTTP_PORT, WS_PORT } from '../server/httpServer';
import { startWSServer, stopWSServer, sendToClients } from '../server/wsServer';
import { ClipItem, ClipStatus, ServerState, WSMessage } from '../types';

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function detectType(msg: WSMessage): ClipItem['type'] {
  if (msg.type === 'image') return 'image';
  if (msg.type === 'file') return 'file';
  if (msg.type === 'link') return 'link';
  if (msg.type === 'audio') return 'audio';
  if (msg.type === 'video') return 'video';
  return 'text';
}

export function useLocalServer() {
  const [serverState, setServerState] = useState<ServerState>({
    isRunning: false,
    ipAddress: null,
    port: HTTP_PORT,
    connectedClients: 0,
  });

  const [clips, setClips] = useState<ClipItem[]>([]);
  const isStarted = useRef(false);
  const progressTotalsRef = useRef<Map<string, number>>(new Map());
  const progressReceivedRef = useRef<Map<string, number>>(new Map());

  // Add a clip item to the list
  const addClip = useCallback((msg: WSMessage, direction: ClipItem['direction'], status: ClipStatus = 'ready') => {
    const item: ClipItem = {
      id: msg.id || generateId(),
      type: detectType(msg),
      direction,
      status,
      content: msg.content ?? '',
      filename: msg.filename,
      mimeType: msg.mimeType,
      timestamp: Date.now(),
    };
    setClips((prev) => [item, ...prev]);
  }, []);

  // Add a placeholder pending clip and return its id
  const addPendingClip = useCallback((
    type: ClipItem['type'],
    direction: ClipItem['direction'],
    filename?: string,
    mimeType?: string,
  ): string => {
    const id = generateId();
    const item: ClipItem = {
      id,
      type,
      direction,
      status: 'pending',
      content: '',
      filename,
      mimeType,
      timestamp: Date.now(),
    };
    setClips((prev) => [item, ...prev]);
    return id;
  }, []);

  // Upgrade a pending clip to ready with full content
  const updateClip = useCallback((id: string, content: string) => {
    setClips((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, content, status: 'ready' as ClipStatus } : c
      )
    );
  }, []);

  const handleIncomingMessage = useCallback((msg: WSMessage) => {
    if (msg.type === 'ping' || msg.type === 'pong') return;

    // Clean up progress tracking refs
    progressReceivedRef.current.delete(msg.id);
    progressTotalsRef.current.delete(msg.id);

    setClips((prev) => {
      const existing = prev.find(c => c.id === msg.id);
      if (existing) {
        return prev.map(c =>
          c.id === msg.id
            ? { ...c, content: msg.content ?? '', status: 'ready' as const, progress: 100 }
            : c
        );
      }
      const item: ClipItem = {
        id: msg.id,
        type: detectType(msg),
        direction: 'received',
        status: 'ready',
        content: msg.content ?? '',
        filename: msg.filename,
        mimeType: msg.mimeType,
        timestamp: Date.now(),
        progress: 100,
      };
      return [item, ...prev];
    });
  }, []);

  // Called when browser sends a file over HTTP POST
  const handleFileReceived = useCallback((msg: WSMessage) => {
    addClip(msg, 'received');
    // Also push it to any other connected WS clients
    sendToClients(msg);
  }, [addClip]);

  // Update connected client count
  const handleClientCount = useCallback((count: number) => {
    setServerState((prev) => ({ ...prev, connectedClients: count }));
  }, []);
  
  const handleProgress = useCallback((
    id: string,
    type: string,
    filename?: string,
    mimeType?: string,
    bytesReceived?: number,
    totalBytes?: number,
  ) => {
    setClips((prev) => {
      const existing = prev.find(c => c.id === id);

      if (!existing) {
        // First call — create pending card at 0%
        progressReceivedRef.current.set(id, 0);
        progressTotalsRef.current.set(id, 0);

        const item: ClipItem = {
          id,
          type: type as ClipItem['type'],
          direction: 'received',
          status: 'pending',
          content: '',
          filename,
          mimeType,
          timestamp: Date.now(),
          progress: 0,
        };
        return [item, ...prev];
      }

      if (bytesReceived !== undefined && bytesReceived > 0) {
        // Track the highest received value we've seen
        const prevReceived = progressReceivedRef.current.get(id) ?? 0;
        if (bytesReceived > prevReceived) {
          progressReceivedRef.current.set(id, bytesReceived);
        }

        // Total keeps growing until fin frame — track the max we've seen
        const prevTotal = progressTotalsRef.current.get(id) ?? 0;
        const currentTotal = Math.max(prevTotal, totalBytes ?? 0, bytesReceived);
        progressTotalsRef.current.set(id, currentTotal);

        const currentReceived = progressReceivedRef.current.get(id) ?? 0;

        // Calculate progress — cap at 90% until message fully delivered
        let pct = 0;
        if (currentTotal > 0) {
          pct = Math.min(90, Math.round((currentReceived / currentTotal) * 100));
        } else {
          // No total known — use chunk count based estimate, slow increment
          pct = Math.min(90, (existing.progress ?? 0) + 5);
        }

        if (pct === existing.progress) return prev; // no change, skip re-render

        return prev.map(c =>
          c.id === id ? { ...c, progress: pct } : c
        );
      }

      return prev;
    });
  }, []);

  const updateClipProgress = useCallback((id: string, progress: number) => {
    setClips((prev) =>
      prev.map((c) => c.id === id ? { ...c, progress } : c)
    );
  }, []);
  
  const startServer = useCallback(async () => {
    if (isStarted.current) return;
    isStarted.current = true;

    const pickLocalIP = async (): Promise<string | null> => {
      const candidates = await Promise.all([
        NetworkInfo.getIPAddress(),
        NetworkInfo.getIPV4Address(),
      ]);

      // Prefer 192.168.x.x, then 10.x.x.x, then 172.16-31.x.x
      const local = candidates.find(
        (ip) =>
          ip &&
          (ip.startsWith("192.168.") ||
            ip.startsWith("10.") ||
            /^172\.(1[6-9]|2\d|3[01])\./.test(ip)),
      );

      return local ?? candidates.find((ip) => ip !== null) ?? null;
    };

    try {
    //   const ip = await NetworkInfo.getIPAddress();
      const ip = await pickLocalIP();

      startHTTPServer(handleFileReceived);
      startWSServer(WS_PORT, handleIncomingMessage, handleClientCount, handleProgress);

      setServerState({
        isRunning: true,
        ipAddress: ip,
        port: HTTP_PORT,
        connectedClients: 0,
      });
    } catch (err) {
      console.error("Failed to start servers:", err);
      isStarted.current = false;
    }
  }, [handleFileReceived, handleIncomingMessage, handleClientCount]);

  // Stop both servers
  const stopServer = useCallback(() => {
    stopHTTPServer();
    stopWSServer();
    isStarted.current = false;
    setServerState((prev) => ({
      ...prev,
      isRunning: false,
      connectedClients: 0,
    }));
  }, []);

  // Send a clip from the phone to all browser clients
  const sendClip = useCallback((msg: Omit<WSMessage, 'id'>) => {
    const fullMsg: WSMessage = { ...msg, id: generateId() };
    sendToClients(fullMsg);
    addClip(fullMsg, 'sent');
  }, [addClip]);

  // Clear all clips
  const clearClips = useCallback(() => setClips([]), []);

  // Auto-start on mount, auto-stop on unmount
  useEffect(() => {
    startServer();
    return () => {
      stopServer();
    };
  }, []);

  return {
    serverState,
    clips,
    sendClip,
    clearClips,
    startServer,
    stopServer,
    addPendingClip,
    updateClip,
    updateClipProgress,
  };
}